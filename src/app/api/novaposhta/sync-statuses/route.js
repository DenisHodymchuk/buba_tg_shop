import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  loadNpConfig,
  trackNpDocuments,
  mapNpStatusCodeToOrderStatus
} from '@/lib/novaposhtaServer';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase не ініціалізовано' }, { status: 500 });
    }

    const config = await loadNpConfig();
    const apiKey = config?.apiKey || process.env.NOVA_POSHTA_API_KEY || process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Не вказано API-ключ Нової Пошти' }, { status: 400 });
    }

    const { data: orders, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, shipping_method, shipping_details, customers(phone)')
      .in('status', ['new', 'printing', 'painting', 'preparing', 'shipping', 'shipped']);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const candidates = (orders || []).filter((o) => {
      const method = o.shipping_method || 'nova_poshta';
      if (method !== 'nova_poshta') return false;
      const ttn = String(o.shipping_details?.ttn || '').replace(/\D/g, '');
      return ttn.length === 14;
    });

    if (!candidates.length) {
      return NextResponse.json({
        ok: true,
        checked: 0,
        changed: 0,
        summary: { shipped: 0, completed: 0, returned: 0 },
        updatedOrders: []
      });
    }

    const docsToTrack = candidates.map((o) => ({
      DocumentNumber: String(o.shipping_details.ttn).replace(/\D/g, ''),
      Phone: o.shipping_details?.phone || o.customers?.phone || config?.senderPhone || ''
    }));

    const tracked = await trackNpDocuments(apiKey, docsToTrack);
    const trackMap = new Map();
    tracked.forEach((item) => {
      const num = String(item?.Number || '').replace(/\D/g, '');
      if (num) trackMap.set(num, item);
    });

    const summary = { shipped: 0, completed: 0, returned: 0 };
    const updatedOrders = [];
    let changedCount = 0;
    let constraintWarning = null;

    for (const order of candidates) {
      const ttn = String(order.shipping_details.ttn).replace(/\D/g, '');
      const info = trackMap.get(ttn);
      if (!info) continue;

      const statusCode = info.StatusCode != null ? String(info.StatusCode) : '';
      const statusText = String(info.Status || '').trim();
      const mappedStatus = mapNpStatusCodeToOrderStatus(statusCode, statusText);

      const prevCode = String(order.shipping_details?.np_status_code || '');
      const prevText = String(order.shipping_details?.np_status_text || '');
      const statusChanged = Boolean(mappedStatus && mappedStatus !== order.status);
      const infoChanged = statusCode !== prevCode || statusText !== prevText;

      if (!statusChanged && !infoChanged) continue;

      const updatedDetails = {
        ...(order.shipping_details || {}),
        np_status_code: statusCode,
        np_status_text: statusText,
        np_status_synced_at: new Date().toISOString()
      };

      const updatePayload = { shipping_details: updatedDetails };
      if (statusChanged) {
        updatePayload.status = mappedStatus;
      }

      const { error: updErr } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', order.id);

      if (updErr) {
        if (String(updErr.message || '').includes('orders_status_check') && mappedStatus === 'returned') {
          constraintWarning = 'Потрібно додати статус returned в обмеження orders_status_check у Supabase SQL Editor';
          // Still save NP status text even if status check constraint blocked 'returned'
          await supabase
            .from('orders')
            .update({ shipping_details: updatedDetails })
            .eq('id', order.id);
          updatedOrders.push({
            id: order.id,
            status: order.status,
            shipping_details: updatedDetails
          });
        }
        continue;
      }

      if (statusChanged) {
        changedCount++;
        if (mappedStatus === 'shipped') summary.shipped++;
        if (mappedStatus === 'completed') summary.completed++;
        if (mappedStatus === 'returned') summary.returned++;
      }

      updatedOrders.push({
        id: order.id,
        status: statusChanged ? mappedStatus : order.status,
        shipping_details: updatedDetails
      });
    }

    return NextResponse.json({
      ok: true,
      checked: candidates.length,
      changed: changedCount,
      summary,
      constraintWarning,
      updatedOrders
    });
  } catch (err) {
    console.error('NP sync-statuses error:', err);
    return NextResponse.json({ error: err?.message || 'Помилка синхронізації статусів НП' }, { status: 500 });
  }
}
