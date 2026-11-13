import { NextResponse } from 'next/server';
import {
  loadBambuAuth,
  fetchBambuBindDevices,
  ensureMqttAndSync
} from '@/lib/bambuCloud';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await loadBambuAuth();
    if (!auth) {
      return NextResponse.json({ connected: false, devices: [] });
    }

    let rawDevices = [];
    try {
      rawDevices = await fetchBambuBindDevices(auth.accessToken, auth.region || 'global');
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        return NextResponse.json({
          connected: false,
          expired: true,
          email: auth.email || '',
          devices: []
        });
      }
      throw err;
    }

    const serials = rawDevices.map((d) => d.dev_id).filter(Boolean);
    const mqttState = await ensureMqttAndSync(auth, serials);

    const devices = rawDevices.map((d) => {
      const t = mqttState.telemetry?.[d.dev_id] || null;
      return {
        serial: d.dev_id,
        name: d.name || d.dev_product_name || 'Bambu Lab',
        model: d.dev_product_name || d.dev_model_name || '',
        online: Boolean(d.online),
        cloud_print_status: d.print_status || '',
        gcode_state: t?.gcode_state || (d.online ? (d.print_status === 'RUNNING' ? 'RUNNING' : 'IDLE') : 'OFFLINE'),
        mc_percent: typeof t?.mc_percent === 'number' ? t.mc_percent : null,
        mc_remaining_time: typeof t?.mc_remaining_time === 'number' ? t.mc_remaining_time : null,
        subtask_name: t?.subtask_name || '',
        gcode_file: t?.gcode_file || '',
        nozzle_temper: t?.nozzle_temper ?? null,
        nozzle_target_temper: t?.nozzle_target_temper ?? null,
        bed_temper: t?.bed_temper ?? null,
        bed_target_temper: t?.bed_target_temper ?? null,
        layer_num: t?.layer_num ?? null,
        total_layer_num: t?.total_layer_num ?? null,
        print_error: t?.print_error ?? 0,
        updatedAt: t?.updatedAt || null
      };
    });

    return NextResponse.json({
      connected: true,
      email: auth.email || '',
      region: auth.region || 'global',
      mqttConnected: Boolean(mqttState.connected),
      mqttError: mqttState.error || null,
      devices
    });
  } catch (err) {
    console.error('Bambu status route error:', err);
    return NextResponse.json({
      connected: false,
      error: err?.message || 'Failed to fetch Bambu status',
      devices: []
    }, { status: 500 });
  }
}
