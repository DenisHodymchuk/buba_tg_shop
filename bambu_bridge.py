import os
import sys
import time
import json
import ssl
import threading
from dotenv import load_dotenv
from supabase import create_client, Client
import paho.mqtt.client as mqtt

# 1. Load Supabase credentials from local environment config file
env_path = os.path.join(os.path.dirname(__file__), '.env.local')
if os.path.exists(env_path):
    load_dotenv(env_path)

supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

print("✅ Supabase Client initialized successfully.")

# Thread-safe locks and state
printers_state = {}
state_lock = threading.Lock()

def fetch_db_printers():
    """Fetch the list of printers registered in the settings table of Supabase."""
    try:
        response = supabase.from_('settings').select('value').eq('key', 'buba_printers').execute()
        if response.data and len(response.data) > 0:
            return response.data[0]['value']
    except Exception as e:
        print(f"❌ Error fetching printers from database: {e}")
    return []

def update_db_printers(printers_list):
    """Save the updated list of printers back to the settings table of Supabase."""
    try:
        supabase.from_('settings').upsert({
            'key': 'buba_printers',
            'value': printers_list
        }).execute()
    except Exception as e:
        print(f"❌ Error updating printers in database: {e}")

def update_order_progress(assigned_printer_name, progress, remaining_minutes):
    """Find any active printing order for this printer and update its progress in Supabase."""
    try:
        # Fetch all orders that are currently in 'printing' status
        response = supabase.from_('orders').select('*').eq('status', 'printing').execute()
        if response.data:
            for order in response.data:
                details = order.get('shipping_details') or {}
                if details.get('assigned_printer') == assigned_printer_name:
                    # Update order details with actual physical progress
                    details['print_progress'] = int(progress)
                    details['print_remaining'] = int(remaining_minutes)
                    
                    supabase.from_('orders').update({
                        'shipping_details': details
                    }).eq('id', order['id']).execute()
                    print(f"📈 Updated Order {order.get('order_number') or order['id'][:8]} progress to {progress}% on {assigned_printer_name} (Remaining: {remaining_minutes} min)")
    except Exception as e:
        print(f"❌ Error updating order progress: {e}")

class BambuPrinterMonitor:
    def __init__(self, printer_config):
        self.config = printer_config
        self.id = printer_config['id']
        self.name = printer_config['name']
        self.ip = printer_config.get('ip_address')
        self.code = printer_config.get('access_code')
        self.sn = printer_config.get('serial_number')
        
        self.is_online = False
        self.nozzle_temp = 0
        self.bed_temp = 0
        self.gcode_state = "IDLE"
        self.mc_percent = 0
        self.mc_remaining = 0
        
        self.client = None
        self.running = True
        self.thread = threading.Thread(target=self.loop, daemon=True)

    def start(self):
        if not self.ip or not self.code or not self.sn:
            print(f"⚠️ Printer {self.name} is missing connection details (IP, Access Code, or SN). Skipping physical connection.")
            return
        self.thread.start()

    def stop(self):
        self.running = False
        if self.client:
            self.client.disconnect()

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"🔌 Connected to physical printer: {self.name} ({self.ip})")
            self.is_online = True
            # Subscribe to the report topic
            client.subscribe(f"device/{self.sn}/report")
            
            # Send initial request to push status
            payload = {
                "pushing": {
                    "sequence_id": "1",
                    "command": "pushall"
                }
            }
            client.publish(f"device/{self.sn}/request", json.dumps(payload))
        else:
            print(f"❌ Connection failed for {self.name} with code {rc}")
            self.is_online = False

    def on_message(self, client, userdata, msg):
        try:
            data = json.loads(msg.payload.decode('utf-8'))
            print_data = data.get('print', {})
            
            # Update connection state
            self.is_online = True
            
            # Extract temperatures
            if 'nozzle_temper' in print_data:
                self.nozzle_temp = int(float(print_data['nozzle_temper']))
            if 'bed_temper' in print_data:
                self.bed_temp = int(float(print_data['bed_temper']))
                
            # Extract print state
            if 'gcode_state' in print_data:
                self.gcode_state = print_data['gcode_state']
                
            # Extract print progress
            if 'mc_percent' in print_data:
                self.mc_percent = int(print_data['mc_percent'])
                
            # Extract remaining time in minutes
            if 'mc_remaining_time' in print_data:
                self.mc_remaining = int(print_data['mc_remaining_time'])
                
            # Trigger updates
            if self.gcode_state == "RUNNING" and self.mc_percent > 0:
                update_order_progress(self.name, self.mc_percent, self.mc_remaining)
                
        except Exception as e:
            print(f"⚠️ Error parsing MQTT message from {self.name}: {e}")

    def on_disconnect(self, client, userdata, rc):
        print(f"🔌 Disconnected from physical printer: {self.name}")
        self.is_online = False

    def loop(self):
        while self.running:
            try:
                self.client = mqtt.Client()
                self.client.username_pw_set("bblp", self.code)
                self.client.tls_set(cert_reqs=ssl.CERT_NONE)
                self.client.tls_insecure_set(True)
                
                self.client.on_connect = self.on_connect
                self.client.on_message = self.on_message
                self.client.on_disconnect = self.on_disconnect
                
                self.client.connect(self.ip, 8883, keepalive=60)
                self.client.loop_forever()
            except Exception as e:
                self.is_online = False
                print(f"🔌 Connection error for {self.name} ({self.ip}): {e}. Retrying in 10s...")
                time.sleep(10)

def main():
    print("🚀 Starting Bambu Lab Local-to-Cloud Bridge Agent...")
    monitors = {}
    
    try:
        while True:
            # 1. Fetch current configuration from Supabase
            db_printers = fetch_db_printers()
            active_ids = set()
            
            with state_lock:
                for p_conf in db_printers:
                    p_id = p_conf['id']
                    active_ids.add(p_id)
                    
                    # If new printer, start monitoring it
                    if p_id not in monitors:
                        print(f"🆕 Found registered printer: {p_conf['name']}")
                        monitor = BambuPrinterMonitor(p_conf)
                        monitors[p_id] = monitor
                        monitor.start()
                    else:
                        # Update config if changed
                        monitor = monitors[p_id]
                        if (monitor.ip != p_conf.get('ip_address') or 
                            monitor.code != p_conf.get('access_code') or 
                            monitor.sn != p_conf.get('serial_number')):
                            print(f"⚙️ Config changed for {p_conf['name']}. Restarting monitor...")
                            monitor.stop()
                            new_monitor = BambuPrinterMonitor(p_conf)
                            monitors[p_id] = new_monitor
                            new_monitor.start()
                
                # Stop removed monitors
                for p_id in list(monitors.keys()):
                    if p_id not in active_ids:
                        print(f"🗑️ Stopping monitor for removed printer ID: {p_id}")
                        monitors[p_id].stop()
                        del monitors[p_id]
            
            # 2. Push active telemetry back to Supabase settings list
            updated_printers = []
            for p_conf in db_printers:
                p_id = p_conf['id']
                if p_id in monitors:
                    m = monitors[p_id]
                    p_conf['is_online'] = m.is_online
                    p_conf['nozzle_temp'] = m.nozzle_temp
                    p_conf['bed_temp'] = m.bed_temp
                    p_conf['gcode_state'] = m.gcode_state
                updated_printers.append(p_conf)
                
            update_db_printers(updated_printers)
            
            # Sleep 5 seconds before checking config again
            time.sleep(5)
            
    except KeyboardInterrupt:
        print("\n👋 Stopping all monitors...")
        for monitor in monitors.values():
            monitor.stop()
        print("✅ Done. Goodbye!")

if __name__ == "__main__":
    main()
