import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { tg_id, message, imageUrl } = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
    }

    if (!tg_id) {
      return NextResponse.json({ error: 'Target chat_id (tg_id) is required' }, { status: 400 });
    }

    const endpoint = imageUrl ? 'sendPhoto' : 'sendMessage';
    const body = imageUrl ? {
      chat_id: tg_id,
      photo: imageUrl,
      caption: message,
      parse_mode: 'HTML'
    } : {
      chat_id: tg_id,
      text: message,
      parse_mode: 'HTML'
    };

    const res = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.description || 'Failed to send message via Telegram');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Individual message error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
