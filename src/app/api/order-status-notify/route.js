import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tg_id, order_number, status, total_amount, ttn } = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token || !tg_id) {
      return NextResponse.json({ error: 'Missing token or chat_id' }, { status: 400 });
    }

    const statusIcons = {
      'new': '🆕 Нові замовлення',
      'printing': '🖨️ Друк',
      'painting': '🎨 Склейка/розфарбування',
      'preparing': '🎁 Пакування',
      'shipping': '📦 Готово до відправлення',
      'shipped': '🚀 В дорозі',
      'completed': '✅ Виконано',
      'cancelled': '❌ Скасовано'
    };

    const statusMessages = {
      'new': 'Ваше замовлення прийнято! Дякуємо! ✨',
      'printing': 'Ваші 3D вироби вже друкуються на принтері! 🔥',
      'painting': 'Ваша фігурка на етапі склейки / розфарбування майстром! 🎨',
      'preparing': 'Фігурки склеєні та готуються до пакування! 🎁',
      'shipping': 'Ваша посилка спакована та готова до відправлення! 📦',
      'shipped': 'Чудові новини! Ваше замовлення в дорозі та прямує до вас! 🚀',
      'completed': 'Замовлення виконано. Сподіваємось, вам сподобається! Дякуємо, що обрали нас. 🙏',
      'cancelled': 'На жаль, замовлення було скасовано. Якщо у вас є питання — пишіть нам.'
    };

    const ttnBlock = ttn ? `\n\n🔢 *Номер ТТН:* \`${ttn}\`` : '';

    const message = `📦 *ОНОВЛЕННЯ ЗАМОВЛЕННЯ${order_number ? ` (${order_number})` : ''}*\n\n` +
                    `Статус: *${statusIcons[status] || status}*${ttnBlock}\n\n` +
                    `${statusMessages[status] || 'Статус вашого замовлення було змінено.'}`;

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
