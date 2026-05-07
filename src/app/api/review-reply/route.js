import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tg_id, reply_text, original_comment } = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token || !tg_id) {
      return NextResponse.json({ error: 'Missing token or chat_id' }, { status: 400 });
    }

    const message = `✨ *Магазин відповів на ваш відгук!*\n\n` +
                    `📝 *Ваш відгук:* _"${original_comment}"_\n\n` +
                    `💬 *Відповідь магазину:* \n${reply_text}\n\n` +
                    `Дякуємо, що ви з нами! 🚀`;

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
    return NextResponse.json({ success: result.ok });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
