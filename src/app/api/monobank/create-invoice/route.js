import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { amount, orderId, items } = await req.json();
    const token = process.env.MONOBANK_TOKEN;

    if (!token) {
      console.error('MONOBANK_TOKEN is missing');
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
    }

    // Monobank invoice creation API
    const response = await fetch('https://api.monobank.ua/api/merchant/invoice/create', {
      method: 'POST',
      headers: {
        'X-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // convert to kopecks
        ccy: 980, // UAH
        merchantPaymInfo: {
          reference: orderId,
          destination: `Оплата замовлення #${orderId}`,
          basketOrder: items.map(item => ({
            name: item.name,
            qty: item.quantity || 1,
            sum: Math.round(item.price * 100),
            icon: item.image_url,
            unit: 'шт.'
          }))
        },
        redirectUrl: `https://${req.headers.get('host')}/order-success?id=${orderId}`,
        webHookUrl: `https://${req.headers.get('host')}/api/webhooks/monobank`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errText || 'Failed to create Monobank invoice');
    }

    return NextResponse.json({ 
      pageUrl: data.pageUrl,
      invoiceId: data.invoiceId 
    });
  } catch (error) {
    console.error('Monobank error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
