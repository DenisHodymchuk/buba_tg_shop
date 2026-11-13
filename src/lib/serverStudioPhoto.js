import sharp from 'sharp';
import { removeBackground } from '@imgly/background-removal-node';
import { supabase } from '@/lib/supabase';

function getOptimizedSourceUrl(url) {
  if (!url) return '';
  if (url.includes('makerworld.bblmw.com') && !url.includes('x-oss-process=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}x-oss-process=image/resize,w_900`;
  }
  return url;
}

/**
 * Removes faint semi-transparent background haze, studio-backdrop halo, and isolated dust islands
 * from the cutout PNG alpha channel while preserving dark clothing, hooves, and small details.
 */
async function cleanAlphaMatte(cutoutBuf, sourceJpegBuf) {
  const { data, info } = await sharp(cutoutBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const total = width * height;

  // Read original RGB at exact same dimensions to detect uniform studio backdrops
  let origRgb = null;
  let hasUniformBackdrop = false;
  let rowBgR = null;
  let rowBgG = null;
  let rowBgB = null;

  if (sourceJpegBuf) {
    const { data: srcData } = await sharp(sourceJpegBuf)
      .resize(width, height, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    origRgb = srcData;

    // Sample left & right outer edges to see if background is a smooth studio backdrop
    rowBgR = new Float32Array(height);
    rowBgG = new Float32Array(height);
    rowBgB = new Float32Array(height);

    let sumR = 0, sumG = 0, sumB = 0;
    for (let y = 0; y < height; y++) {
      const lIdx = (y * width + 3) * 3;
      const rIdx = (y * width + (width - 4)) * 3;
      const rr = (srcData[lIdx] + srcData[rIdx]) * 0.5;
      const gg = (srcData[lIdx + 1] + srcData[rIdx + 1]) * 0.5;
      const bb = (srcData[lIdx + 2] + srcData[rIdx + 2]) * 0.5;
      rowBgR[y] = rr;
      rowBgG[y] = gg;
      rowBgB[y] = bb;
      sumR += rr; sumG += gg; sumB += bb;
    }

    const meanR = sumR / height;
    const meanG = sumG / height;
    const meanB = sumB / height;
    let maxEdgeDiff = 0;
    for (let y = 0; y < height; y += 8) {
      const lIdx = (y * width + 3) * 3;
      const rIdx = (y * width + (width - 4)) * 3;
      const dL = Math.abs(srcData[lIdx] - meanR) + Math.abs(srcData[lIdx + 1] - meanG) + Math.abs(srcData[lIdx + 2] - meanB);
      const dR = Math.abs(srcData[rIdx] - meanR) + Math.abs(srcData[rIdx + 1] - meanG) + Math.abs(srcData[rIdx + 2] - meanB);
      if (dL > maxEdgeDiff) maxEdgeDiff = dL;
      if (dR > maxEdgeDiff) maxEdgeDiff = dR;
    }
    hasUniformBackdrop = maxEdgeDiff < 90;
  }

  // 1. Identify candidate exterior pixels (transparent OR halo matching studio backdrop)
  //    and rescue low-confidence dark feet/hooves in lower half against uniform backdrop
  const canBeExterior = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    let a = data[i * channels + 3];
    let isHalo = false;

    if (hasUniformBackdrop && origRgb) {
      const y = (i / width) | 0;
      const dr = origRgb[i * 3] - rowBgR[y];
      const dg = origRgb[i * 3 + 1] - rowBgG[y];
      const db = origRgb[i * 3 + 2] - rowBgB[y];
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (a > 0 && a < 190 && dist < 34) {
        isHalo = true;
      } else if (a >= 12 && a < 45 && dist > 55 && y > height * 0.55) {
        a = 200;
        data[i * channels] = origRgb[i * 3];
        data[i * channels + 1] = origRgb[i * 3 + 1];
        data[i * channels + 2] = origRgb[i * 3 + 2];
        data[i * channels + 3] = a;
      }
    }

    if (a < 45 || isHalo) {
      canBeExterior[i] = 1;
    }
  }

  // 2. Flood-fill from image borders ONLY through canBeExterior pixels.
  //    This guarantees interior parts (like white chest/fur/eyes) are NEVER punched out!
  const isExterior = new Uint8Array(total);
  const queue = new Int32Array(total);
  let qHead = 0;
  let qTail = 0;

  for (let x = 0; x < width; x++) {
    const top = x;
    const bot = (height - 1) * width + x;
    if (canBeExterior[top] && !isExterior[top]) { isExterior[top] = 1; queue[qTail++] = top; }
    if (canBeExterior[bot] && !isExterior[bot]) { isExterior[bot] = 1; queue[qTail++] = bot; }
  }
  for (let y = 0; y < height; y++) {
    const left = y * width;
    const right = y * width + (width - 1);
    if (canBeExterior[left] && !isExterior[left]) { isExterior[left] = 1; queue[qTail++] = left; }
    if (canBeExterior[right] && !isExterior[right]) { isExterior[right] = 1; queue[qTail++] = right; }
  }

  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % width;
    const y = (idx - x) / width;

    if (x > 0) {
      const n = idx - 1;
      if (canBeExterior[n] && !isExterior[n]) { isExterior[n] = 1; queue[qTail++] = n; }
    }
    if (x + 1 < width) {
      const n = idx + 1;
      if (canBeExterior[n] && !isExterior[n]) { isExterior[n] = 1; queue[qTail++] = n; }
    }
    if (y > 0) {
      const n = idx - width;
      if (canBeExterior[n] && !isExterior[n]) { isExterior[n] = 1; queue[qTail++] = n; }
    }
    if (y + 1 < height) {
      const n = idx + width;
      if (canBeExterior[n] && !isExterior[n]) { isExterior[n] = 1; queue[qTail++] = n; }
    }
  }

  // Build foreground mask: anything NOT reachable from exterior border
  const fg = new Uint8Array(total);
  let fgCount = 0;
  for (let i = 0; i < total; i++) {
    if (!isExterior[i]) {
      fg[i] = 1;
      fgCount++;
      // Restore any interior hole (and its 1px transition border) using original RGB while keeping outer edge AA
      const y = (i / width) | 0;
      const x = i % width;
      const touchesExterior =
        (x > 0 && isExterior[i - 1]) ||
        (x + 1 < width && isExterior[i + 1]) ||
        (y > 0 && isExterior[i - width]) ||
        (y + 1 < height && isExterior[i + width]);

      if (canBeExterior[i] || (!touchesExterior && data[i * channels + 3] < 245)) {
        if (origRgb) {
          data[i * channels] = origRgb[i * 3];
          data[i * channels + 1] = origRgb[i * 3 + 1];
          data[i * channels + 2] = origRgb[i * 3 + 2];
        }
        data[i * channels + 3] = 255;
      }
    } else {
      data[i * channels + 3] = 0;
    }
  }

  if (fgCount === 0) {
    return cutoutBuf;
  }

  // 3. Keep only significant connected foreground components (>= 0.15% of foreground area)
  const visited = new Uint8Array(total);
  const keep = new Uint8Array(total);
  const minComponentSize = Math.max(120, Math.floor(fgCount * 0.0015));

  for (let start = 0; start < total; start++) {
    if (!fg[start] || visited[start]) continue;

    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    visited[start] = 1;

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width;
      const y = (idx - x) / width;

      if (x > 0) {
        const n = idx - 1;
        if (fg[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
      }
      if (x + 1 < width) {
        const n = idx + 1;
        if (fg[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
      }
      if (y > 0) {
        const n = idx - width;
        if (fg[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
      }
      if (y + 1 < height) {
        const n = idx + width;
        if (fg[n] && !visited[n]) { visited[n] = 1; queue[tail++] = n; }
      }
    }

    if (tail >= minComponentSize) {
      for (let k = 0; k < tail; k++) {
        keep[queue[k]] = 1;
      }
    }
  }

  // 4. Apply kept mask and gently tighten edge alpha ramp
  for (let i = 0; i < total; i++) {
    const alphaIdx = i * channels + 3;
    if (!keep[i]) {
      data[alphaIdx] = 0;
    } else {
      const a = data[alphaIdx];
      data[alphaIdx] = a >= 170 ? 255 : Math.round(((a - 45) / 125) * 255);
    }
  }

  return sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
}

/**
 * Generates a unified dark-slate studio product photo on the Node.js server
 * using @imgly/background-removal-node + sharp, and uploads it to Supabase Storage.
 */
export async function generateServerStudioPhoto(imageUrl, { aspectRatio = '1:1' } = {}) {
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
    throw new Error('Некоректне посилання на фото');
  }

  const optimizedUrl = getOptimizedSourceUrl(imageUrl);
  const res = await fetch(optimizedUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://makerworld.com/'
    }
  });

  if (!res.ok) {
    throw new Error(`Не вдалося завантажити фото (${res.status})`);
  }

  const rawBuf = Buffer.from(await res.arrayBuffer());
  const resizedJpeg = await sharp(rawBuf)
    .rotate()
    .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer();

  const inputBlob = new Blob([resizedJpeg], { type: 'image/jpeg' });
  const cutoutBlob = await removeBackground(inputBlob, {
    model: 'medium',
    output: { format: 'image/png', quality: 0.95 }
  });
  const rawCutoutBuf = Buffer.from(await cutoutBlob.arrayBuffer());
  const cutoutBuf = await cleanAlphaMatte(rawCutoutBuf, resizedJpeg);

  // Tightly trim transparent edges around the figurine
  let trimmedBuf;
  try {
    trimmedBuf = await sharp(cutoutBuf).trim({ threshold: 5 }).png().toBuffer();
  } catch {
    trimmedBuf = cutoutBuf;
  }

  const outW = 1000;
  const outH = aspectRatio === '4:5' ? 1250 : 1000;

  const maxDrawW = Math.round(outW * 0.78);
  const maxDrawH = Math.round(outH * 0.76);

  const fittedSubjectBuf = await sharp(trimmedBuf)
    .resize(maxDrawW, maxDrawH, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  const subjMeta = await sharp(fittedSubjectBuf).metadata();
  const drawW = subjMeta.width || maxDrawW;
  const drawH = subjMeta.height || maxDrawH;

  const drawX = Math.round((outW - drawW) / 2);
  const padTop = Math.round(outH * 0.09);
  const drawY = Math.round(padTop + (maxDrawH - drawH) * 0.58);

  const floorY = drawY + drawH - Math.round(drawH * 0.02);
  const shadowRx = Math.max(120, Math.round(drawW * 0.48));
  const shadowRy = Math.max(22, Math.round(outH * 0.036));
  const discRx = Math.round(shadowRx * 1.45);
  const discRy = Math.round(discRx * 0.24);

  const studioSvg = `
    <svg width="${outW}" height="${outH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0F1117"/>
          <stop offset="65%" stop-color="#131620"/>
          <stop offset="100%" stop-color="#181B25"/>
        </linearGradient>
        <radialGradient id="rim" cx="50%" cy="44%" r="52%">
          <stop offset="0%" stop-color="#93A2FA" stop-opacity="0.16"/>
          <stop offset="55%" stop-color="#93A2FA" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#0F1117" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="disc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#1E2230" stop-opacity="0.9"/>
          <stop offset="70%" stop-color="#141721" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#0F1117" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.72"/>
          <stop offset="60%" stop-color="#000000" stop-opacity="0.30"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${outW}" height="${outH}" fill="url(#bg)"/>
      <rect width="${outW}" height="${outH}" fill="url(#rim)"/>
      <ellipse cx="${outW / 2}" cy="${floorY}" rx="${discRx}" ry="${discRy}" fill="url(#disc)"/>
      <ellipse cx="${outW / 2}" cy="${floorY}" rx="${shadowRx}" ry="${shadowRy}" fill="url(#shadow)"/>
    </svg>
  `;

  const finalWebp = await sharp(Buffer.from(studioSvg))
    .composite([{ input: fittedSubjectBuf, left: drawX, top: drawY }])
    .webp({ quality: 92 })
    .toBuffer();

  if (!supabase) {
    throw new Error('Supabase не підключено');
  }

  const fileName = `studio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
  const webpBlob = new Blob([finalWebp], { type: 'image/webp' });
  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(fileName, webpBlob, { contentType: 'image/webp', upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  const { data: pub } = supabase.storage.from('products').getPublicUrl(fileName);
  if (!pub?.publicUrl) {
    throw new Error('Не вдалося отримати URL завантаженого фото');
  }

  return pub.publicUrl;
}
