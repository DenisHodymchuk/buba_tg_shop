import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');
    const rawFilename = searchParams.get('filename') || 'buba-photo.jpg';

    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      return NextResponse.json({ error: 'Некоректне посилання на фото' }, { status: 400 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://makerworld.com/'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Не вдалося завантажити фото (${response.status})` }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    // Визначаємо розширення файлу
    let ext = 'jpg';
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
    else if (contentType.includes('gif')) ext = 'gif';
    else {
      const urlExtMatch = imageUrl.split('?')[0].match(/\.(jpg|jpeg|png|webp|gif)$/i);
      if (urlExtMatch) ext = urlExtMatch[1].toLowerCase();
    }

    const cleanBase = rawFilename
      .replace(/\.(jpg|jpeg|png|webp|gif)$/i, '')
      .replace(/[^a-zA-Z0-9а-яА-ЯіїєґІЇЄҐ_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '-') || 'photo';

    const finalFilename = `${cleanBase}.${ext}`;
    const asciiFallback = `buba-photo-${Date.now()}.${ext}`;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(finalFilename)}`,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('Download image proxy error:', error);
    return NextResponse.json({ error: error.message || 'Помилка завантаження файлу' }, { status: 500 });
  }
}
