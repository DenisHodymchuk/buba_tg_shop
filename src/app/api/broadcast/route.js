import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { message, imageUrl } = await request.json();
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users who allowed notifications
    const { data: subscribers, error } = await supabase
      .from('customers')
      .select('tg_id')
      .eq('allow_notifications', true)
      .not('tg_id', 'is', null);

    if (error) throw error;

    let sentCount = 0;
    const sendPromises = subscribers.map(async (sub) => {
      try {
        const endpoint = imageUrl ? 'sendPhoto' : 'sendMessage';
        const body = imageUrl ? {
          chat_id: sub.tg_id,
          photo: imageUrl,
          caption: message,
          parse_mode: 'HTML'
        } : {
          chat_id: sub.tg_id,
          text: message,
          parse_mode: 'HTML'
        };

        const res = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (res.ok) sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${sub.tg_id}:`, err);
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sent_count: sentCount });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
