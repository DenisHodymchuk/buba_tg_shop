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

    // Збираємо всі унікальні зображення з різних масивів
    const allImages = new Set();
    if (data.coverUrl) allImages.add(data.coverUrl);
    
    // Фото від автора дизайну
    data.designExtension?.design_pictures?.forEach(pic => {
      if (pic.url) allImages.add(pic.url);
    });
    
    // Фото з першого профілю друку (інстансу)
    const firstInstance = data.instances?.[0];
    firstInstance?.pictures?.forEach(pic => {
      if (pic.url) allImages.add(pic.url);
    });
    if (firstInstance?.cover) allImages.add(firstInstance.cover);

    const imagesArray = Array.from(allImages);
    const mainImage = imagesArray[0] || '';
    const extraImages = imagesArray.slice(1);

    // Технічні параметри з першого профілю
    // --- Логіка перекладу та очищення назви ---
    const translateAndClean = (text) => {
      if (!text) return '';
      let cleaned = text
        .replace(/Flexi|Articulated|3D|Print|Bambu|Lab|Model|Toy|Gift/gi, '') // Прибираємо технічні слова
        .replace(/\s+/g, ' ')
        .trim();
      
      const dictionary = {
        'Dragon': 'Дракон', 'Egg': 'Яйце', 'Dino': 'Динозавр', 'Cat': 'Кіт', 'Dog': 'Пес',
        'Box': 'Коробка', 'Stand': 'Підставка', 'Holder': 'Тримач', 'Organizer': 'Органайзер',
        'Toy': 'Іграшка', 'Figure': 'Фігурка', 'Sculpture': 'Скульптура', 'Keychain': 'Брелок'
      };

      Object.entries(dictionary).forEach(([eng, ukr]) => {
        const regex = new RegExp(eng, 'gi');
        cleaned = cleaned.replace(regex, ukr);
      });
      return cleaned || text;
    };

    const name = translateAndClean(data.title);

    // --- Розрахунок собівартості ---
    const printTimeSeconds = firstInstance?.printTime || 0;
    const printTimeHours = printTimeSeconds / 3600;
    const weightG = firstInstance?.weight || 0;
    const weightKg = weightG / 1000;

    // Формула: (Вага * Ціна пластику) + (Час * Потужність * Ціна квт)
    const electricityCost = printTimeHours * 0.15 * 4.32;
    const plaCost = (weightKg * 550) + electricityCost;
    const petgCost = (weightKg * 450) + electricityCost;

    const plasticType = firstInstance?.instanceFilaments?.[0]?.type || 'PLA';
    const color = firstInstance?.instanceFilaments?.[0]?.color || '';
    const licenseInfo = data.license ? `Ліцензія: ${data.license}` : 'Безпечно для дому';

    const costNote = `\n\n--- Орієнтовна собівартість ---\n` +
                     `⚡ Електрика: ~${electricityCost.toFixed(2)} грн (${(printTimeHours).toFixed(1)} год)\n` +
                     `🧵 PLA: ~${plaCost.toFixed(0)} грн\n` +
                     `🧵 PETG: ~${petgCost.toFixed(0)} грн`;

    const description = (data.summary || '') + costNote;

    return NextResponse.json({
      name: name,
      description: description,
      image_url: mainImage,
      image_urls: extraImages,
      category: data.categories?.[0]?.name || '3D Модель',
      weight: weightG ? `${weightG}г` : '',
      plastic_type: plasticType,
      color: color,
      safety_info: licenseInfo,
      source: 'MakerWorld (Smart API)'
    });

  } catch (error) {
    console.error('MakerWorld Parser Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
