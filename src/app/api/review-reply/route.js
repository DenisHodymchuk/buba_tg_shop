import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tg_id, reply_text, original_comment } = await req.json();
    console.log('Review reply notification request:', { tg_id, reply_text });
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token || !tg_id) {
      console.error('Missing token or tg_id');
      return NextResponse.json({ error: 'Missing token or chat_id' }, { status: 400 });
    }

    const message = `🛸 Магазин *BUBA* відповів на ваш відгук!\n\n` +
                    `💬 ${reply_text}`;

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: tg_id,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await response.json();
    console.log('Telegram API response:', result);
    return NextResponse.json({ success: result.ok, details: result });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
