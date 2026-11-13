import { supabase } from '@/lib/supabase';

function getOptimizedSourceUrl(url) {
  if (!url) return '';
  if (url.includes('makerworld.bblmw.com') && !url.includes('x-oss-process=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}x-oss-process=image/resize,w_900`;
  }
  return url;
}

async function downscaleBlobIfNeeded(blob, maxDim = 900) {
  const bitmap = await createImageBitmap(blob);
  if (bitmap.width <= maxDim && bitmap.height <= maxDim) {
    bitmap.close();
    return blob;
  }
  const scale = Math.min(maxDim / bitmap.width, maxDim / bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b || blob), 'image/jpeg', 0.92);
  });
}

/**
 * Generates a unified dark-slate studio product photo 100% locally in the browser
 * for free ($0, unlimited) using @imgly/background-removal + HTML5 Canvas.
 */
export async function generateFreeStudioPhoto(imageUrl, { aspectRatio = '1:1', onProgress } = {}) {
  if (!imageUrl) throw new Error('Немає посилання на фото');

  onProgress?.('Завантаження фото...');
  const optimizedUrl = getOptimizedSourceUrl(imageUrl);

  // 1. Fetch via proxy to avoid CORS issues on MakerWorld / external CDNs
  const fetchUrl = optimizedUrl.startsWith('/') || optimizedUrl.includes('supabase.co')
    ? optimizedUrl
    : `/api/download-image?url=${encodeURIComponent(optimizedUrl)}`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    throw new Error(`Не вдалося завантажити фото (${res.status})`);
  }
  const rawBlob = await res.blob();
  const sourceBlob = await downscaleBlobIfNeeded(rawBlob, 900);

  // 2. Dynamically import @imgly/background-removal and run in Web Worker with fast quint8 model
  onProgress?.('Запуск ШІ-моделі...');
  const { removeBackground } = await import('@imgly/background-removal');
  const cutoutBlob = await removeBackground(sourceBlob, {
    model: 'isnet_quint8',
    proxyToWorker: true,
    output: { format: 'image/png', quality: 0.92 },
    progress: (key, current, total) => {
      if (total > 0) {
        const pct = Math.round((current / total) * 100);
        if (key.includes('fetch')) {
          onProgress?.(`Завантаження ШІ: ${pct}%`);
        } else if (key.includes('compute')) {
          onProgress?.(`Обробка фото: ${pct}%`);
        }
      }
    }
  });

  onProgress?.('Рендер студії...');
  const bitmap = await createImageBitmap(cutoutBlob);

  // 3. Find tight bounding box of the non-transparent subject
  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = bitmap.width;
  tmpCanvas.height = bitmap.height;
  const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true });
  tmpCtx.drawImage(bitmap, 0, 0);

  const imgData = tmpCtx.getImageData(0, 0, bitmap.width, bitmap.height);
  const { data, width: w, height: h } = imgData;

  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    const rowOffset = y * w * 4;
    for (let x = 0; x < w; x++) {
      if (data[rowOffset + x * 4 + 3] > 20) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    minX = 0;
    minY = 0;
    maxX = w - 1;
    maxY = h - 1;
  }

  const subjectW = maxX - minX + 1;
  const subjectH = maxY - minY + 1;

  // 4. Render unified dark studio backdrop + soft rim light + pedestal shadow
  const outW = 1000;
  const outH = aspectRatio === '4:5' ? 1250 : 1000;

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');

  const bgGrad = ctx.createLinearGradient(0, 0, 0, outH);
  bgGrad.addColorStop(0, '#0F1117');
  bgGrad.addColorStop(0.65, '#131620');
  bgGrad.addColorStop(1, '#181B25');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, outW, outH);

  const rimGrad = ctx.createRadialGradient(
    outW * 0.5, outH * 0.44, outW * 0.05,
    outW * 0.5, outH * 0.44, outW * 0.52
  );
  rimGrad.addColorStop(0, 'rgba(147, 162, 250, 0.16)');
  rimGrad.addColorStop(0.55, 'rgba(147, 162, 250, 0.05)');
  rimGrad.addColorStop(1, 'rgba(15, 17, 23, 0)');
  ctx.fillStyle = rimGrad;
  ctx.fillRect(0, 0, outW, outH);

  const padX = outW * 0.11;
  const padTop = outH * 0.09;
  const maxDrawW = outW - padX * 2;
  const maxDrawH = outH * 0.76;
  const scale = Math.min(maxDrawW / subjectW, maxDrawH / subjectH);

  const drawW = Math.round(subjectW * scale);
  const drawH = Math.round(subjectH * scale);
  const drawX = Math.round((outW - drawW) / 2);
  const drawY = Math.round(padTop + (maxDrawH - drawH) * 0.58);

  const floorY = drawY + drawH - Math.round(drawH * 0.02);
  const shadowRx = Math.max(120, Math.round(drawW * 0.48));
  const shadowRy = Math.max(22, Math.round(outH * 0.036));

  const discGrad = ctx.createRadialGradient(outW / 2, floorY, 10, outW / 2, floorY, shadowRx * 1.45);
  discGrad.addColorStop(0, 'rgba(30, 34, 48, 0.9)');
  discGrad.addColorStop(0.7, 'rgba(20, 23, 33, 0.45)');
  discGrad.addColorStop(1, 'rgba(15, 17, 23, 0)');
  ctx.save();
  ctx.translate(outW / 2, floorY);
  ctx.scale(1, 0.24);
  ctx.beginPath();
  ctx.arc(0, 0, shadowRx * 1.45, 0, Math.PI * 2);
  ctx.fillStyle = discGrad;
  ctx.fill();
  ctx.restore();

  const contactGrad = ctx.createRadialGradient(outW / 2, floorY, 4, outW / 2, floorY, shadowRx);
  contactGrad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  contactGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.30)');
  contactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.save();
  ctx.translate(outW / 2, floorY);
  ctx.scale(1, shadowRy / shadowRx);
  ctx.beginPath();
  ctx.arc(0, 0, shadowRx, 0, Math.PI * 2);
  ctx.fillStyle = contactGrad;
  ctx.fill();
  ctx.restore();

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, minX, minY, subjectW, subjectH, drawX, drawY, drawW, drawH);
  bitmap.close();

  // 5. Export WebP and upload to Supabase Storage
  onProgress?.('Збереження...');
  const outBlob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Помилка експорту зображення'))),
      'image/webp',
      0.92
    );
  });

  if (!supabase) {
    throw new Error('Supabase не підключено');
  }

  const fileName = `studio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`;
  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(fileName, outBlob, { contentType: 'image/webp', upsert: false });

  if (uploadError) {
    throw uploadError;
  }

  const { data: pub } = supabase.storage.from('products').getPublicUrl(fileName);
  if (!pub?.publicUrl) {
    throw new Error('Не вдалося отримати URL завантаженого фото');
  }

  return pub.publicUrl;
}
