import { NextResponse } from 'next/server';
import { loadNpConfig } from '@/lib/novaposhtaServer';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'marking100';
    const rawRefs = searchParams.get('refs') || '';
    const refs = rawRefs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!refs.length) {
      return NextResponse.json({ error: 'Не вказано ТТН або реєстр для друку' }, { status: 400 });
    }

    const config = await loadNpConfig();
    if (!config?.apiKey) {
      return NextResponse.json({ error: 'Кабінет Нової Пошти не підключено' }, { status: 400 });
    }

    const key = encodeURIComponent(config.apiKey);
    let url = '';

    if (type === 'scansheet') {
      const refsSegment = refs.map((r) => `refs[]/${encodeURIComponent(r)}`).join('/');
      url = `https://my.novaposhta.ua/scanSheet/printScanSheet/${refsSegment}/type/pdf/apiKey/${key}`;
    } else if (type === 'marking85') {
      const ordersSegment = refs.map((r) => `orders[]/${encodeURIComponent(r)}`).join('/');
      url = `https://my.novaposhta.ua/orders/printMarking85x85/${ordersSegment}/type/pdf/apiKey/${key}/zebra`;
    } else {
      // Default: 100x100 thermal printer PDF (Zebra)
      const ordersSegment = refs.map((r) => `orders[]/${encodeURIComponent(r)}`).join('/');
      url = `https://my.novaposhta.ua/orders/printMarking100x100/${ordersSegment}/type/pdf/apiKey/${key}/zebra`;
    }

    const npRes = await fetch(url, { cache: 'no-store' });
    if (!npRes.ok) {
      return NextResponse.json(
        { error: `Нова Пошта повернула помилку друку (${npRes.status})` },
        { status: 502 }
      );
    }

    const pdfBuffer = await npRes.arrayBuffer();
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="np-${type}-${Date.now()}.pdf"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    console.error('NP print GET error:', err);
    return NextResponse.json({ error: err?.message || 'Помилка друку PDF НП' }, { status: 500 });
  }
}
