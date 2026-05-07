import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes('makerworld.com')) {
      return NextResponse.json({ error: 'Некоректне посилання MakerWorld' }, { status: 400 });
    }

    // Додаємо User-Agent, щоб сайт не блокував запит
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (!response.ok) {
      throw new Error('Не вдалося отримати сторінку');
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
