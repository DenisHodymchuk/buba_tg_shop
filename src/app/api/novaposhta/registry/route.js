import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { loadNpConfig, createNpScanSheet, listNpScanSheets } from '@/lib/novaposhtaServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await loadNpConfig();
    if (!config?.apiKey) {
      return NextResponse.json({ ok: true, registries: [] });
    }
    const registries = await listNpScanSheets(config.apiKey);
    return NextResponse.json({ ok: true, registries });
  } catch (err) {
    console.error('NP registry GET error:', err);
    return NextResponse.json({ error: err?.message || 'Помилка отримання реєстрів НП' }, { status: 400 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderIds = [], documentRefs = [] } = body || {};

    const config = await loadNpConfig();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'Кабінет Нової Пошти не підключено' }, { status: 400 });
    }

    let refsToInsert = Array.isArray(documentRefs) ? documentRefs.filter(Boolean) : [];
    let matchedOrders = [];

    if (Array.isArray(orderIds) && orderIds.length > 0 && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('id, shipping_details')
        .in('id', orderIds);
      if (error) throw new Error(error.message);
      matchedOrders = (data || []).filter((o) => o.shipping_details?.np_doc_ref);
      refsToInsert = matchedOrders.map((o) => o.shipping_details.np_doc_ref);
    }

    if (!refsToInsert.length) {
      return NextResponse.json(
        { error: 'Немає ТТН, створених через API НП, для додавання в реєстр' },
        { status: 400 }
      );
    }

    const sheet = await createNpScanSheet(config.apiKey, refsToInsert);

    // Save registry info on orders in Supabase
    const updatedOrderIds = [];
    if (supabase && matchedOrders.length > 0) {
      for (const ord of matchedOrders) {
        const updatedDetails = {
          ...(ord.shipping_details || {}),
          np_scansheet_ref: sheet.ref,
          np_scansheet_number: sheet.number
        };
        await supabase
          .from('orders')
          .update({ shipping_details: updatedDetails })
          .eq('id', ord.id);
        updatedOrderIds.push({ id: ord.id, shipping_details: updatedDetails });
      }
    }

    return NextResponse.json({
      ok: true,
      registry: sheet,
      count: refsToInsert.length,
      updatedOrders: updatedOrderIds
    });
  } catch (err) {
    console.error('NP registry POST error:', err);
    return NextResponse.json({ error: err?.message || 'Помилка створення реєстру НП' }, { status: 400 });
  }
}
