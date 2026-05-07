import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('makerworld.com')) {
      return NextResponse.json({ error: 'Некоректне посилання MakerWorld' }, { status: 400 });
    }

    // Покращені заголовки для імітації реального користувача
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://makerworld.com/',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Upgrade-Insecure-Requests': '1'
      },
      next: { revalidate: 0 } // Вимикаємо кешування Next.js для цього запиту
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('MakerWorld Response Error:', response.status, errorText.slice(0, 500));
      throw new Error(`Сайт повернув помилку ${response.status}. Можливо, діє захист від ботів.`);
    }

    const html = await response.text();

    // Витягуємо дані через мета-теги OpenGraph (вони зазвичай є на MakerWorld)
    const extractMeta = (property) => {
      const match = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
      return match ? match[1] : null;
    };

    const name = extractMeta('og:title')?.replace(' | MakerWorld', '') || '';
    const description = extractMeta('og:description') || '';
    const image_url = extractMeta('og:image') || '';

    // Спроба знайти категорію або теги ( MakerWorld часто має JSON-LD )
    let category = '3D Модель';
    try {
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (jsonLdMatch) {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.category) category = jsonLd.category;
      }
    } catch (e) {
      console.error('JSON-LD parse error:', e);
    }

    return NextResponse.json({
      name,
      description,
      image_url,
      category,
      source: 'MakerWorld'
    });

  } catch (error) {
    console.error('MakerWorld Parser Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
