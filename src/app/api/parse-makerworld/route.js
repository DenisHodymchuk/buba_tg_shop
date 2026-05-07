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
    // --- Допоміжні функції ---
    const stripHtml = (html) => {
      if (!html) return '';
      return html
        .replace(/<[^>]*>?/gm, '') // Видаляємо всі теги
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\n\s*\n/g, '\n') // Прибираємо зайві пусті рядки
        .trim();
    };

    const translateAndClean = (text) => {
      if (!text) return '';
      let cleaned = text
        .replace(/Flexi|Articulated|3D|Print|Bambu|Lab|Model|Toy|Gift|Cute/gi, '') 
        .replace(/\s+/g, ' ')
        .trim();
      
      const dictionary = {
        'Dragon': 'Дракон', 'Egg': 'Яйце', 'Dino': 'Динозавр', 'Cat': 'Котик', 'Dog': 'Песик',
        'Box': 'Коробка', 'Stand': 'Підставка', 'Holder': 'Тримач', 'Organizer': 'Органайзер',
        'Toy': 'Іграшка', 'Figure': 'Фігурка', 'Sculpture': 'Скульптура', 'Keychain': 'Брелок',
        'Axolotl': 'Аксолотль', 'Shark': 'Акула', 'Snake': 'Змія', 'Turtle': 'Черепаха'
      };

      Object.entries(dictionary).forEach(([eng, ukr]) => {
        const regex = new RegExp(`\\b${eng}\\b`, 'gi');
        cleaned = cleaned.replace(regex, ukr);
      });
      return cleaned || text;
    };

    const name = translateAndClean(data.title);

    // --- Розрахунок собівартості ---
    // Беремо ТІЛЬКИ перший інстанс, щоб не сумувати всі варіанти принтерів
    const printTimeSeconds = firstInstance?.prediction || 0;
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

    const costNote = `Орієнтовна собівартість:\n` +
                     `⚡ Електрика: ~${electricityCost.toFixed(2)} грн (${(printTimeHours).toFixed(1)} год)\n` +
                     `🧵 PLA: ~${plaCost.toFixed(0)} грн\n` +
                     `🧵 PETG: ~${petgCost.toFixed(0)} грн`;

    // --- Переклад опису ---
    let finalDescription = stripHtml(data.summary);
    try {
      // Використовуємо MyMemory API для перекладу (обмежимо 500 символами для стабільності)
      const transRes = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(finalDescription.slice(0, 500))}&langpair=en|uk`);
      const transData = await transRes.json();
      if (transData.responseData?.translatedText) {
        finalDescription = transData.responseData.translatedText;
      }
    } catch (e) {
      console.error('Translation error:', e);
    }

    // Розділяємо опис та примітку для адміна спеціальним сепаратором
    const combinedDescription = `${finalDescription}\n\n|||ADMIN_NOTES|||\n${costNote}`;

    return NextResponse.json({
      name: name,
      description: combinedDescription,
      image_url: mainImage,
      image_urls: extraImages,
      category: data.categories?.[0]?.name || '3D Модель',
      weight: weightG ? `${weightG}г` : '',
      plastic_type: plasticType,
      color: color,
      safety_info: licenseInfo,
      source: 'MakerWorld (Clean API)'
    });

  } catch (error) {
    console.error('MakerWorld Parser Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
