// Shared helpers and constants for Sales, Production, Kanban, and Shipping

export const FILAMENT_COLORS = [
  { id: 'white', label: 'Білий', hex: '#ffffff', border: '#cbd5e1' },
  { id: 'black', label: 'Чорний', hex: '#18181b', border: '#52525b' },
  { id: 'gray', label: 'Сірий', hex: '#94a3b8', border: '#94a3b8' },
  { id: 'red', label: 'Червоний', hex: '#ef4444', border: '#ef4444' },
  { id: 'blue', label: 'Синій', hex: '#3b82f6', border: '#3b82f6' },
  { id: 'light_blue', label: 'Блакитний', hex: '#38bdf8', border: '#38bdf8' },
  { id: 'green', label: 'Зелений', hex: '#22c55e', border: '#22c55e' },
  { id: 'lime', label: 'Салатовий', hex: '#84cc16', border: '#84cc16' },
  { id: 'yellow', label: 'Жовтий', hex: '#eab308', border: '#eab308' },
  { id: 'orange', label: 'Помаранчевий', hex: '#f97316', border: '#f97316' },
  { id: 'pink', label: 'Рожевий', hex: '#ec4899', border: '#ec4899' },
  { id: 'purple', label: 'Фіолетовий', hex: '#a855f7', border: '#a855f7' },
  { id: 'gold', label: 'Золотий', hex: '#f59e0b', gradient: 'linear-gradient(135deg, #fde047, #ca8a04)', border: '#eab308' },
  { id: 'silver', label: 'Срібний', hex: '#cbd5e1', gradient: 'linear-gradient(135deg, #f8fafc, #64748b)', border: '#94a3b8' },
  { id: 'copper', label: 'Мідь / Бронза', hex: '#d97706', gradient: 'linear-gradient(135deg, #fb923c, #78350f)', border: '#d97706' },
  { id: 'brown', label: 'Коричневий', hex: '#78350f', border: '#a16207' },
  { id: 'beige', label: 'Бежевий', hex: '#fde68a', border: '#fcd34d' },
  { id: 'mint', label: 'М\'ятний', hex: '#2dd4bf', border: '#2dd4bf' },
  { id: 'rainbow', label: 'Веселковий', hex: '#ec4899', gradient: 'linear-gradient(135deg, #ef4444, #eab308, #22c55e, #3b82f6, #a855f7)', border: '#a855f7' },
  { id: 'chameleon', label: 'Хамелеон / Шовк', hex: '#8b5cf6', gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6, #06b6d4)', border: '#06b6d4' },
  { id: 'glow', label: 'Світиться (Glow)', hex: '#4ade80', gradient: 'linear-gradient(135deg, #bbf7d0, #22c55e)', border: '#4ade80' },
  { id: 'transparent', label: 'Прозорий', hex: 'rgba(255,255,255,0.25)', border: '#94a3b8' }
];

export const QUICK_ITEM_TAGS = [
  'Матовий',
  'Глянець / Шовк',
  'Як на фото',
  'Брелок з кільцем',
  'Без кільця',
  'Рухома іграшка',
  'Індивідуальний колір'
];

export const QUICK_ORDER_NOTES = [
  '🎁 На подарунок',
  '⚡ Термінове замовлення',
  '📸 Скинути фото перед відправкою',
  '🔕 Не телефонувати',
  '📦 Надійно запакувати'
];

export function getColorMeta(colorNameOrId) {
  if (!colorNameOrId) return null;
  const lower = String(colorNameOrId).toLowerCase().trim();
  return FILAMENT_COLORS.find(
    c => c.id === lower || c.label.toLowerCase() === lower
  ) || { id: lower, label: colorNameOrId, hex: '#a78bfa', border: '#a78bfa' };
}

/**
 * Smart Paste Parser for Ukrainian shipping details from Instagram / Telegram / OLX messages.
 * Example input:
 * "Коваленко Дмитро, 097 123 45 67, м. Київ, відділення №25"
 */
export function parseSmartShippingText(rawText) {
  if (!rawText || typeof rawText !== 'string') return {};

  const text = rawText.trim();
  const result = {
    firstName: '',
    lastName: '',
    phone: '',
    cityQuery: '',
    warehouseNumber: '',
    rawWarehouseHint: ''
  };

  // 1. Extract Ukrainian phone number
  const phoneRegex = /(?:\+?38)?[\s\-()]*?(0\d{2}[\s\-()]*?\d{3}[\s\-()]*?\d{2}[\s\-()]*?\d{2}|\d{9})/g;
  const phoneMatch = phoneRegex.exec(text);
  let remainingText = text;

  if (phoneMatch) {
    const digits = phoneMatch[0].replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('0')) {
      result.phone = `+38${digits}`;
    } else if (digits.length === 12 && digits.startsWith('380')) {
      result.phone = `+${digits}`;
    } else if (digits.length === 9) {
      result.phone = `+380${digits}`;
    } else {
      result.phone = phoneMatch[0].trim();
    }
    remainingText = remainingText.replace(phoneMatch[0], ' | ');
  }

  // 2. Extract warehouse / postomat number
  const whRegex = /(?:відділення|відд\.?|від\b|нп|нова\s*пошта|поштомат|почтомат|отделение|отд\.?|№|#)\s*(?:№|#)?\s*(\d{1,5})/i;
  const whMatch = whRegex.exec(remainingText);
  if (whMatch) {
    const isPostomat = /поштомат|почтомат/i.test(whMatch[0]);
    result.warehouseNumber = whMatch[1];
    result.rawWarehouseHint = isPostomat ? `Поштомат №${whMatch[1]}` : `Відділення №${whMatch[1]}`;
    remainingText = remainingText.replace(whMatch[0], ' | ');
  } else {
    // Check if there is a standalone number at the end like "Київ 25"
    const trailingNumMatch = /(?:№|#)\s*(\d{1,5})/.exec(remainingText);
    if (trailingNumMatch) {
      result.warehouseNumber = trailingNumMatch[1];
      result.rawWarehouseHint = `№${trailingNumMatch[1]}`;
      remainingText = remainingText.replace(trailingNumMatch[0], ' | ');
    }
  }

  // 3. Split remaining text into segments by newlines, commas, semicolons, or pipes
  const segments = remainingText
    .split(/[\n,;|\t]+/)
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 1);

  // Identify city vs name
  let cityFound = '';
  let nameFound = '';

  for (const seg of segments) {
    const cleanSeg = seg
      .replace(/^(м\.|місто|г\.|город|смт\.?|с\.|село|нп|нова пошта|доставка)\s+/i, '')
      .trim();

    // Explicit city prefix
    if (/^(м\.|місто|г\.|город|смт\.?|с\.|село)\s+/i.test(seg) && !cityFound) {
      cityFound = cleanSeg.split(/\s+(?:від|нп|пошт|вул)/i)[0].trim();
      continue;
    }

    const words = cleanSeg.split(' ').filter(Boolean);
    // Typical Ukrainian full name is 2 or 3 capitalized words without numbers
    const looksLikeName =
      words.length >= 2 &&
      words.length <= 3 &&
      !/\d/.test(cleanSeg) &&
      !/відділення|поштомат|пошта|вул\.|вулиця|область|р-н|район/i.test(cleanSeg);

    if (!nameFound && looksLikeName) {
      nameFound = cleanSeg;
    } else if (!cityFound && words.length >= 1 && words.length <= 3 && !/\d/.test(cleanSeg)) {
      cityFound = cleanSeg;
    } else if (!cityFound && /\d/.test(cleanSeg) && !result.warehouseNumber) {
      // Might be "Київ 25" in a single segment
      const cityAndNum = /^([А-ЯІЇЄҐа-яіїєґ'\-\s]+?)\s+(\d{1,5})$/.exec(cleanSeg);
      if (cityAndNum) {
        cityFound = cityAndNum[1].trim();
        result.warehouseNumber = cityAndNum[2];
        result.rawWarehouseHint = `№${cityAndNum[2]}`;
      }
    }
  }

  if (nameFound) {
    const nameParts = nameFound.split(' ').filter(Boolean);
    if (nameParts.length === 2) {
      result.firstName = nameParts[0];
      result.lastName = nameParts[1];
    } else if (nameParts.length >= 3) {
      // Usually Last First Patronymic or First Last
      result.lastName = nameParts[0];
      result.firstName = nameParts.slice(1).join(' ');
    } else {
      result.firstName = nameFound;
    }
  }

  if (cityFound) {
    result.cityQuery = cityFound;
  }

  return result;
}

export function formatCleanPhoneForCopy(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('380')) {
    return digits.slice(2); // Returns 0XXXXXXXXX (very convenient for Nova Poshta app)
  }
  return phone.trim();
}
