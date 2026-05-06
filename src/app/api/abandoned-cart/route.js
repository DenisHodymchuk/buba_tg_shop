import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find users with non-empty carts who:
    // 1. Haven't been notified in the last 24 hours
    // 2. Last activity was more than 30 minutes ago
    // 3. Allow notifications
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: candidates, error } = await supabase
      .from('customers')
      .select('tg_id, cart_data, first_name')
      .eq('allow_notifications', true)
      .not('cart_data', 'is', null)
      .not('tg_id', 'is', null)
      .lt('last_cart_activity', thirtyMinutesAgo)
      .or(`last_abandoned_notified_at.is.null,last_abandoned_notified_at.lt.${twentyFourHoursAgo}`);

    if (error) throw error;

    // Filter candidates who have actual items (not empty array)
    const toNotify = candidates.filter(c => Array.isArray(c.cart_data) && c.cart_data.length > 0);

    let sentCount = 0;
    const message = `🛒 <b>Ваш кошик сумує!</b>\n\nВи забули свої товари в магазині. Поверніться у додаток, щоб завершити покупку та отримати своє замовлення!`;

    const sendPromises = toNotify.map(async (user) => {
      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.tg_id,
            text: message,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [[
                { text: "🛍️ ВІДКРИТИ МАГАЗИН", url: "https://t.me/ваш_бот_username/app" }
              ]]
            }
          })
        });

        if (res.ok) {
          sentCount++;
          // Mark as notified
          await supabase
            .from('customers')
            .update({ last_abandoned_notified_at: new Date().toISOString() })
            .eq('tg_id', user.tg_id);
        }
      } catch (err) {
        console.error(`Failed to send abandoned cart to ${user.tg_id}:`, err);
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ 
      success: true, 
      candidates_found: candidates.length,
      notifications_sent: sentCount 
    });
  } catch (error) {
    console.error('Abandoned cart error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
