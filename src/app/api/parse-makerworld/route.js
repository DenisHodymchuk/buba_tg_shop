import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { url } = await req.json();

    // Витягуємо ID моделі з посилання (наприклад, з .../models/123456)
    const modelIdMatch = url.match(/\/models\/(\d+)/);
    if (!modelIdMatch) {
      return NextResponse.json({ error: 'Не вдалося знайти ID моделі у посиланні' }, { status: 400 });
    }
    const modelId = modelIdMatch[1];

    // Використовуємо неофіційний API Bambu Lab (він не блокується Cloudflare)
    const apiUrl = `https://api.bambulab.com/v1/design-service/design/${modelId}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.error('Bambu API Error:', response.status);
      throw new Error(`Помилка API: ${response.status}. Можливо, модель видалено або доступ обмежено.`);
    }

    const data = await response.json();

    return NextResponse.json({
      name: data.title || '',
      description: data.summary || '',
      image_url: data.coverUrl || '',
      category: data.categories?.[0]?.name || '3D Модель',
      source: 'MakerWorld (API)'
    });

  } catch (error) {
    console.error('MakerWorld Parser Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
