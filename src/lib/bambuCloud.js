import mqtt from 'mqtt';
import { supabase } from '@/lib/supabase';

const BAMBU_AUTH_KEY = 'bambu_cloud_auth';

export function getBambuBaseUrl(region = 'global') {
  return region === 'cn' ? 'https://api.bambulab.cn' : 'https://api.bambulab.com';
}

export function getBambuMqttUrl(region = 'global') {
  return region === 'cn'
    ? 'mqtts://cn.mqtt.bambulab.com:8883'
    : 'mqtts://us.mqtt.bambulab.com:8883';
}

export function getBambuHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function parseUidFromJwt(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.uid || payload.sub || payload.user_id || null;
  } catch {
    return null;
  }
}

export async function loadBambuAuth() {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', BAMBU_AUTH_KEY)
    .single();
  if (error || !data?.value?.accessToken) return null;
  return data.value;
}

export async function saveBambuAuth(auth) {
  if (!supabase) return;
  await supabase.from('settings').upsert({
    key: BAMBU_AUTH_KEY,
    value: auth
  });
}

export async function clearBambuAuth() {
  disconnectBambuMqtt();
  if (!supabase) return;
  await supabase.from('settings').upsert({
    key: BAMBU_AUTH_KEY,
    value: null
  });
}

export async function fetchBambuProfile(accessToken, region = 'global') {
  const res = await fetch(`${getBambuBaseUrl(region)}/v1/user-service/my/profile`, {
    headers: getBambuHeaders(accessToken),
    cache: 'no-store'
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchBambuBindDevices(accessToken, region = 'global') {
  const res = await fetch(`${getBambuBaseUrl(region)}/v1/iot-service/api/user/bind`, {
    headers: getBambuHeaders(accessToken),
    cache: 'no-store'
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Bambu bind error (${res.status}): ${text.slice(0, 150)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return Array.isArray(data?.devices) ? data.devices : [];
}

// Persistent MQTT manager across requests on the Node.js server
const globalMgr = globalThis.__bambuMqttManager || {
  client: null,
  token: null,
  uid: null,
  region: 'global',
  connected: false,
  lastError: null,
  telemetry: {}, // { [dev_id]: { ...parsed, updatedAt } }
  subscribed: new Set(),
  lastPushAll: {}
};
globalThis.__bambuMqttManager = globalMgr;

export function disconnectBambuMqtt() {
  if (globalMgr.client) {
    try {
      globalMgr.client.end(true);
    } catch {
      // ignore
    }
  }
  globalMgr.client = null;
  globalMgr.token = null;
  globalMgr.uid = null;
  globalMgr.connected = false;
  globalMgr.lastError = null;
  globalMgr.telemetry = {};
  globalMgr.subscribed = new Set();
  globalMgr.lastPushAll = {};
}

function mergePrintTelemetry(serial, printData) {
  if (!printData || typeof printData !== 'object') return;
  const prev = globalMgr.telemetry[serial] || {};
  const next = {
    ...prev,
    gcode_state: printData.gcode_state ?? prev.gcode_state ?? 'IDLE',
    mc_percent: typeof printData.mc_percent === 'number' ? printData.mc_percent : (prev.mc_percent ?? 0),
    mc_remaining_time: typeof printData.mc_remaining_time === 'number' ? printData.mc_remaining_time : (prev.mc_remaining_time ?? 0),
    subtask_name: printData.subtask_name ?? prev.subtask_name ?? '',
    gcode_file: printData.gcode_file ?? prev.gcode_file ?? '',
    nozzle_temper: typeof printData.nozzle_temper === 'number' ? Math.round(printData.nozzle_temper) : prev.nozzle_temper,
    nozzle_target_temper: typeof printData.nozzle_target_temper === 'number' ? Math.round(printData.nozzle_target_temper) : prev.nozzle_target_temper,
    bed_temper: typeof printData.bed_temper === 'number' ? Math.round(printData.bed_temper) : prev.bed_temper,
    bed_target_temper: typeof printData.bed_target_temper === 'number' ? Math.round(printData.bed_target_temper) : prev.bed_target_temper,
    layer_num: typeof printData.layer_num === 'number' ? printData.layer_num : prev.layer_num,
    total_layer_num: typeof printData.total_layer_num === 'number' ? printData.total_layer_num : prev.total_layer_num,
    print_error: typeof printData.print_error === 'number' ? printData.print_error : (prev.print_error ?? 0),
    wifi_signal: printData.wifi_signal ?? prev.wifi_signal,
    updatedAt: Date.now()
  };
  globalMgr.telemetry[serial] = next;
}

export async function ensureMqttAndSync(auth, deviceIds = []) {
  if (!auth?.accessToken || !auth?.uid) return { connected: false, error: 'Missing token or uid' };

  const needsReconnect =
    !globalMgr.client ||
    globalMgr.token !== auth.accessToken ||
    globalMgr.uid !== auth.uid ||
    globalMgr.region !== (auth.region || 'global');

  if (needsReconnect) {
    disconnectBambuMqtt();
    globalMgr.token = auth.accessToken;
    globalMgr.uid = auth.uid;
    globalMgr.region = auth.region || 'global';

    const client = mqtt.connect(getBambuMqttUrl(globalMgr.region), {
      username: `u_${auth.uid}`,
      password: auth.accessToken,
      clientId: `ande3d_${Date.now().toString(36)}`,
      clean: true,
      connectTimeout: 8000,
      reconnectPeriod: 5000,
      rejectUnauthorized: false
    });

    globalMgr.client = client;

    client.on('connect', () => {
      globalMgr.connected = true;
      globalMgr.lastError = null;
      for (const sn of globalMgr.subscribed) {
        client.subscribe(`device/${sn}/report`);
      }
    });

    client.on('message', (topic, messageBuf) => {
      try {
        const match = String(topic).match(/^device\/([^/]+)\/report$/);
        if (!match) return;
        const sn = match[1];
        const payload = JSON.parse(messageBuf.toString('utf8'));
        if (payload?.print) {
          mergePrintTelemetry(sn, payload.print);
        }
      } catch {
        // ignore malformed MQTT packet
      }
    });

    client.on('error', (err) => {
      globalMgr.lastError = err?.message || 'MQTT error';
    });

    client.on('close', () => {
      globalMgr.connected = false;
    });
  }

  // Wait briefly if connecting on cold start
  if (!globalMgr.connected) {
    await new Promise((resolve) => {
      const started = Date.now();
      const timer = setInterval(() => {
        if (globalMgr.connected || globalMgr.lastError || Date.now() - started > 2200) {
          clearInterval(timer);
          resolve();
        }
      }, 80);
    });
  }

  // Subscribe & request pushall for any devices without fresh data (> 10s old)
  if (globalMgr.client && globalMgr.connected) {
    const now = Date.now();
    let pushedAny = false;
    for (const sn of deviceIds) {
      if (!sn) continue;
      if (!globalMgr.subscribed.has(sn)) {
        globalMgr.subscribed.add(sn);
        globalMgr.client.subscribe(`device/${sn}/report`);
      }
      const lastTelem = globalMgr.telemetry[sn]?.updatedAt || 0;
      const lastPush = globalMgr.lastPushAll[sn] || 0;
      if (now - lastTelem > 10000 && now - lastPush > 8000) {
        globalMgr.lastPushAll[sn] = now;
        pushedAny = true;
        globalMgr.client.publish(
          `device/${sn}/request`,
          JSON.stringify({
            pushing: {
              sequence_id: String(Math.floor(now / 1000) % 100000),
              command: 'pushall',
              version: 1,
              push_target: 1
            }
          })
        );
      }
    }

    // Give printers up to 1.2s to respond to pushall on first poll
    if (pushedAny) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }

  return {
    connected: globalMgr.connected,
    error: globalMgr.lastError,
    telemetry: globalMgr.telemetry
  };
}
