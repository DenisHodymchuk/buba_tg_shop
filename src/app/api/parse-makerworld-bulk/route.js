import { NextResponse } from 'next/server';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

function cleanTitle(text) {
  if (!text) return '';
  return text
    .replace(/Flexi|Articulated|3D|Print|Bambu|Lab|Model|Toy|Gift|Cute/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || text.trim();
}

async function translateText(text) {
  if (!text) return '';
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=uk&dt=t&q=${encodeURIComponent(text.slice(0, 1800))}`
    );
    if (!res.ok) return text;
    const data = await res.json();
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('') || text;
    }
    return text;
  } catch {
    return text;
  }
}

function extractModelIds(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return [];
  const ids = new Set();

  // Match /models/123456 or models\/123456
  const urlMatches = rawInput.matchAll(/models(?:\/|\\\/)(\d{4,10})/gi);
  for (const m of urlMatches) {
    ids.add(m[1]);
  }

  // Also check standalone numeric IDs on separate lines / comma-separated
  const tokens = rawInput.split(/[\s,;]+/);
  for (const t of tokens) {
    const trimmed = t.trim();
    if (/^\d{4,10}$/.test(trimmed)) {
      ids.add(trimmed);
    }
  }

  return Array.from(ids);
}

async function fetchSingleModel(modelId, shouldTranslate = true) {
  const apiUrl = `https://api.bambulab.com/v1/design-service/design/${modelId}`;
  const response = await fetch(apiUrl, {
    headers: HEADERS,
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`API ${response.status} для моделі ${modelId}`);
  }

  const data = await response.json();

  const allImages = new Set();
  if (data.coverUrl) allImages.add(data.coverUrl);

  data.designExtension?.design_pictures?.forEach(pic => {
    if (pic?.url) allImages.add(pic.url);
  });

  const firstInstance = data.instances?.[0];
  firstInstance?.pictures?.forEach(pic => {
    if (pic?.url) allImages.add(pic.url);
  });
  if (firstInstance?.cover) allImages.add(firstInstance.cover);

  const printTimeSeconds = firstInstance?.prediction || 0;
  const printTimeHours = printTimeSeconds / 3600;
  const weightG = firstInstance?.weight || 0;
  const weightKg = weightG / 1000;

  const electricityCost = printTimeHours * 0.15 * 4.32;
  const plaCost = (weightKg * 550) + electricityCost;
  const petgCost = (weightKg * 450) + electricityCost;

  const plasticType = firstInstance?.instanceFilaments?.[0]?.type || 'PLA';
  const color = firstInstance?.instanceFilaments?.[0]?.color || '';

  const costNote =
    `Орієнтовна собівартість:\n` +
    `⚡ Електрика: ~${electricityCost.toFixed(2)} грн (${printTimeHours.toFixed(1)} год)\n` +
    `--------------------------\n` +
    `🧵 PLA (пластик): ~${(weightKg * 550).toFixed(2)} грн\n` +
    `✅ Разом (PLA): ~${plaCost.toFixed(0)} грн\n` +
    `--------------------------\n` +
    `🧵 PETG (пластик): ~${(weightKg * 450).toFixed(2)} грн\n` +
    `✅ Разом (PETG): ~${petgCost.toFixed(0)} грн`;

  const originalTitle = (data.title || `Model ${modelId}`).trim();
  const cleaned = cleanTitle(originalTitle);

  let translatedTitle = cleaned;

  if (shouldTranslate) {
    const trName = await translateText(cleaned);
    translatedTitle = trName ? trName.charAt(0).toUpperCase() + trName.slice(1) : cleaned;
  }

  return {
    id: String(modelId),
    originalTitle,
    cleanedTitle: cleaned,
    translatedTitle,
    description: '',
    allImages: Array.from(allImages),
    suggestedCategory: data.categories?.[0]?.name || '',
    weight: weightG ? `${weightG}г` : '',
    plastic_type: plasticType,
    color,
    safety_info: '',
    creator: data.designCreator?.name || data.designCreator?.handle || '',
    sourceUrl: `https://makerworld.com/en/models/${modelId}`
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'discover') {
      const rawInput = (body.input || '').trim();
      if (!rawInput) {
        return NextResponse.json({ error: 'Вставте посилання або пошуковий запит' }, { status: 400 });
      }

      const extractedIds = extractModelIds(rawInput);
      if (extractedIds.length > 0) {
        return NextResponse.json({
          mode: 'ids',
          modelIds: extractedIds
        });
      }

      // Check if it's a MakerWorld profile URL like https://makerworld.com/en/@username
      const handleMatch = rawInput.match(/makerworld\.com\/[^/]+\/@([a-zA-Z0-9_.-]+)/i) || rawInput.match(/^@([a-zA-Z0-9_.-]+)$/);
      const searchKeyword = handleMatch ? handleMatch[1] : rawInput;

      const searchUrl = `https://api.bambulab.com/v1/search-service/select/design2?keyword=${encodeURIComponent(searchKeyword)}&limit=100&offset=0`;
      const res = await fetch(searchUrl, { headers: HEADERS, next: { revalidate: 0 } });
      if (!res.ok) {
        return NextResponse.json({ error: `Помилка пошуку MakerWorld (${res.status})` }, { status: 502 });
      }

      const data = await res.json();
      const hits = Array.isArray(data.hits) ? data.hits : [];

      // If it looked like a @handle, prioritize exact creator handle matches first
      const sortedHits = handleMatch
        ? [...hits].sort((a, b) => {
            const aMatch = a.designCreator?.handle?.toLowerCase() === searchKeyword.toLowerCase() ? 1 : 0;
            const bMatch = b.designCreator?.handle?.toLowerCase() === searchKeyword.toLowerCase() ? 1 : 0;
            return bMatch - aMatch;
          })
        : hits;

      return NextResponse.json({
        mode: 'search',
        isProfileUrl: Boolean(handleMatch),
        handle: handleMatch ? handleMatch[1] : null,
        modelIds: sortedHits.map(h => String(h.id)),
        previewHits: sortedHits.map(h => ({
          id: String(h.id),
          title: h.title,
          cover: h.cover,
          creatorHandle: h.designCreator?.handle || '',
          creatorName: h.designCreator?.name || ''
        }))
      });
    }

    if (action === 'fetch-details') {
      const modelIds = Array.isArray(body.modelIds) ? body.modelIds.slice(0, 15) : [];
      const translate = body.translate !== false;

      if (modelIds.length === 0) {
        return NextResponse.json({ models: [], errors: [] });
      }

      const settled = await Promise.allSettled(
        modelIds.map(id => fetchSingleModel(id, translate))
      );

      const models = [];
      const errors = [];

      settled.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          models.push(result.value);
        } else {
          errors.push({ id: modelIds[idx], error: result.reason?.message || 'Помилка завантаження' });
        }
      });

      return NextResponse.json({ models, errors });
    }

    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 });
  } catch (error) {
    console.error('Bulk MakerWorld Parser Error:', error);
    return NextResponse.json({ error: error.message || 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
