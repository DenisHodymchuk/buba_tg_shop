const SIZES_START = '|||SIZES|||';
const SIZES_END = '|||END_SIZES|||';
const ADMIN_NOTES_MARKER = '|||ADMIN_NOTES|||';

/**
 * Parses size variants (`[{ label: '15 см', price: 500 }, ...]`) from a product object.
 * Supports both an explicit `product.sizes` array and embedded metadata in `product.description`.
 */
export function parseProductSizes(product) {
  if (!product) return [];

  if (Array.isArray(product.sizes) && product.sizes.length > 0) {
    return normalizeSizes(product.sizes);
  }

  const desc = typeof product.description === 'string' ? product.description : '';
  const startIdx = desc.indexOf(SIZES_START);
  if (startIdx === -1) return [];

  const afterStart = startIdx + SIZES_START.length;
  const endIdx = desc.indexOf(SIZES_END, afterStart);
  const jsonStr = (endIdx === -1 ? desc.slice(afterStart) : desc.slice(afterStart, endIdx)).trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return normalizeSizes(parsed);
  } catch {
    return [];
  }
}

export function normalizeSizes(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(item => ({
      label: String(item?.label || '').trim(),
      price: Math.max(1, Math.round(Number(item?.price) || 0))
    }))
    .filter(item => item.label.length > 0 && Number.isFinite(item.price) && item.price > 0);
}

/**
 * Strips internal metadata markers (`|||ADMIN_NOTES|||`, `|||SIZES|||...|||END_SIZES|||`)
 * so customers only see the clean product description.
 */
export function stripProductMeta(description) {
  if (typeof description !== 'string') return '';
  let clean = description;

  const sStart = clean.indexOf(SIZES_START);
  if (sStart !== -1) {
    const sEnd = clean.indexOf(SIZES_END, sStart + SIZES_START.length);
    if (sEnd !== -1) {
      clean = clean.slice(0, sStart) + clean.slice(sEnd + SIZES_END.length);
    } else {
      clean = clean.slice(0, sStart);
    }
  }

  if (clean.includes(ADMIN_NOTES_MARKER)) {
    clean = clean.split(ADMIN_NOTES_MARKER)[0];
  }

  return clean.trim();
}

/**
 * Embeds (or removes) the `|||SIZES|||...|||END_SIZES|||` block in `description`
 * while preserving any existing `|||ADMIN_NOTES|||` section.
 */
export function embedProductSizes(description, sizes) {
  const raw = typeof description === 'string' ? description : '';

  // Separate admin notes if present
  let mainPart = raw;
  let adminPart = '';
  if (raw.includes(ADMIN_NOTES_MARKER)) {
    const idx = raw.indexOf(ADMIN_NOTES_MARKER);
    mainPart = raw.slice(0, idx);
    adminPart = raw.slice(idx);
  }

  // Remove any old sizes block from mainPart
  const sStart = mainPart.indexOf(SIZES_START);
  if (sStart !== -1) {
    const sEnd = mainPart.indexOf(SIZES_END, sStart + SIZES_START.length);
    mainPart = sEnd !== -1
      ? mainPart.slice(0, sStart) + mainPart.slice(sEnd + SIZES_END.length)
      : mainPart.slice(0, sStart);
  }
  mainPart = mainPart.trim();

  const normalized = normalizeSizes(sizes);
  const sizesBlock = normalized.length > 0
    ? `${SIZES_START}${JSON.stringify(normalized)}${SIZES_END}`
    : '';

  return [mainPart, sizesBlock, adminPart.trim()].filter(Boolean).join('\n\n');
}
