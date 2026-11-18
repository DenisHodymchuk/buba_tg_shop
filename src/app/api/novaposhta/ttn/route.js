import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { loadNpConfig, createNpTtnForOrder } from '@/lib/novaposhtaServer';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId, orderIds, overrides = {}, markShipped = false } = body || {};

    const config = await loadNpConfig();
    if (!config?.apiKey) {
      return NextResponse.json(
        { error: 'Кабінет Нової Пошти не підключено. Додайте API-ключ у налаштуваннях НП.' },
        { status: 400 }
      );
    }

    const ids = Array.isArray(orderIds) && orderIds.length > 0
      ? orderIds
      : orderId
        ? [orderId]
        : [];

    if (!ids.length) {
      return NextResponse.json({ error: 'Не передано жодного замовлення' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Supabase не ініціалізовано' }, { status: 500 });
    }

    const { data: ordersList, error: fetchErr } = await supabase
      .from('orders')
      .select('*, customers(first_name, last_name, phone)')
      .in('id', ids);

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const orderMap = new Map((ordersList || []).map((o) => [String(o.id), o]));
    const results = [];

    for (const id of ids) {
      const order = orderMap.get(String(id));
      if (!order) {
        results.push({ orderId: id, ok: false, error: 'Замовлення не знайдено' });
        continue;
      }

      try {
        const created = await createNpTtnForOrder(config, order, overrides);
        const updatedDetails = {
          ...(order.shipping_details || {}),
          ttn: created.ttn,
          np_doc_ref: created.ref,
          np_cost: created.costOnSite,
          np_estimated_date: created.estimatedDeliveryDate,
          np_created_at: new Date().toISOString()
        };

        const updatePayload = { shipping_details: updatedDetails };
        if (markShipped && order.status !== 'completed') {
          updatePayload.status = 'shipped';
        }

        const { error: updErr } = await supabase
          .from('orders')
          .update(updatePayload)
          .eq('id', order.id);

        if (updErr) throw new Error(updErr.message);

        results.push({
          orderId: order.id,
          ok: true,
          ttn: created.ttn,
          ref: created.ref,
          costOnSite: created.costOnSite,
          estimatedDeliveryDate: created.estimatedDeliveryDate,
          shipping_details: updatedDetails,
          status: updatePayload.status || order.status
        });
      } catch (err) {
        results.push({
          orderId: order.id,
          ok: false,
          error: err?.message || 'Помилка створення ТТН'
        });
      }
    }

    const successCount = results.filter((r) => r.ok).length;
    return NextResponse.json({
      ok: successCount > 0,
      successCount,
      failedCount: results.length - successCount,
      results
    });
  } catch (err) {
    console.error('NP TTN POST error:', err);
    return NextResponse.json({ error: err?.message || 'Внутрішня помилка створення ТТН' }, { status: 500 });
  }
}
