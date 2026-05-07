import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { tg_id, order_number, status, total_amount } = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token || !tg_id) {
      return NextResponse.json({ error: 'Missing token or chat_id' }, { status: 400 });
    }

    const statusIcons = {
      'preparing': '🛠️ Підготовка',
      'printing': '🖨️ Друкується',
      'shipping': '🚚 Відправлено',
      'completed': '✅ Виконано',
      'cancelled': '❌ Скасовано'
    };

    const statusMessages = {
      'preparing': 'Ми вже готуємо ваше замовлення до роботи! ✨',
      'printing': 'Ваші 3D вироби вже на принтері! Скоро вони будуть готові. 🔥',
      'shipping': 'Чудові новини! Ваше замовлення вже прямує до вас. 🚀',
      'completed': 'Замовлення завершено. Сподіваємось, вам сподобається! Дякуємо, що обрали нас. 🙏',
      'cancelled': 'На жаль, замовлення було скасовано. Якщо у вас є питання — пишіть нам.'
    };

    const message = `📦 *ОНОВЛЕННЯ ЗАМОВЛЕННЯ*\n\n` +
                    `Статус: *${statusIcons[status] || status}*\n\n` +
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
