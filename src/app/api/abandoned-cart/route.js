import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!botToken || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: allUsers, error } = await supabase
      .from('customers')
      .select('tg_id, cart_data, first_name, allow_notifications, last_cart_activity');

    if (error) throw error;

    const threshold = 60 * 1000; // 1 minute
    const now = Date.now();

    const toNotify = (allUsers || []).filter(c => {
      const lastActivity = c.last_cart_activity ? new Date(c.last_cart_activity).getTime() : 0;
      return (
        c.allow_notifications === true &&
        Array.isArray(c.cart_data) && 
        c.cart_data.length > 0 &&
        c.tg_id &&
        (now - lastActivity) > threshold
      );
    });

    let sentCount = 0;
    const message = `🛒 <b>Ваш кошик сумує! ✨</b>\n\nВи забули свої товари в магазині. Поверніться у додаток, щоб завершити покупку та отримати своє замовлення!`;

    for (const user of toNotify) {
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
                { text: "🛍️ ВІДКРИТИ МАГАЗИН", url: "https://t.me/bubalab_shop_bot/app" }
              ]]
            }
          })
        });

        if (res.ok) {
          sentCount++;
          await supabase
            .from('customers')
            .update({ last_abandoned_notified_at: new Date().toISOString() })
            .eq('tg_id', user.tg_id);
        }
      } catch (err) {
        console.error('Send error:', err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: toNotify.length,
      sent: sentCount 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
