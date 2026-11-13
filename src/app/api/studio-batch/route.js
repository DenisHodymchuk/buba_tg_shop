import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateServerStudioPhoto } from '@/lib/serverStudioPhoto';

// Persist job state on globalThis so Next.js dev HMR doesn't wipe it mid-run
const globalStore = globalThis.__bubaStudioJob || {
  running: false,
  stopRequested: false,
  done: 0,
  total: 0,
  errors: 0,
  currentName: '',
  lastError: '',
  updatedProducts: [],
  finishedAt: null
};
globalThis.__bubaStudioJob = globalStore;

async function runBackgroundBatch(targets, { aspectRatio, keepReferenceInGallery }) {
  globalStore.running = true;
  globalStore.stopRequested = false;
  globalStore.done = 0;
  globalStore.total = targets.length;
  globalStore.errors = 0;
  globalStore.currentName = '';
  globalStore.lastError = '';
  globalStore.updatedProducts = [];
  globalStore.finishedAt = null;

  for (const product of targets) {
    if (globalStore.stopRequested) break;
    globalStore.currentName = product.name || `Товар #${product.id}`;

    try {
      const studioUrl = await generateServerStudioPhoto(product.image_url, { aspectRatio });

      const oldMain = product.image_url;
      const existingExtras = Array.isArray(product.image_urls) ? product.image_urls : [];
      const nextExtras =
        keepReferenceInGallery && oldMain && !oldMain.includes('/studio-') && !existingExtras.includes(oldMain)
          ? [oldMain, ...existingExtras]
          : existingExtras;

      if (supabase) {
        const { data: updatedRows, error: dbErr } = await supabase
          .from('products')
          .update({
            image_url: studioUrl,
            image_urls: nextExtras
          })
          .eq('id', product.id)
          .select();

        if (dbErr) throw dbErr;
        if (updatedRows?.[0]) {
          globalStore.updatedProducts.push(updatedRows[0]);
        }
      }
    } catch (err) {
      console.error(`Background studio error for ${product.id}:`, err);
      globalStore.errors++;
      globalStore.lastError = err.message || 'Помилка обробки';
    } finally {
      globalStore.done++;
    }
  }

  globalStore.running = false;
  globalStore.currentName = '';
  globalStore.finishedAt = Date.now();
}

export async function GET() {
  return NextResponse.json({
    running: globalStore.running,
    done: globalStore.done,
    total: globalStore.total,
    errors: globalStore.errors,
    currentName: globalStore.currentName,
    lastError: globalStore.lastError,
    updatedProducts: globalStore.updatedProducts,
    finishedAt: globalStore.finishedAt
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'single') {
      const { imageUrl, aspectRatio = '1:1' } = body;
      const url = await generateServerStudioPhoto(imageUrl, { aspectRatio });
      return NextResponse.json({ url });
    }

    if (action === 'stop') {
      globalStore.stopRequested = true;
      return NextResponse.json({ stopped: true });
    }

    if (action === 'start') {
      if (globalStore.running) {
        return NextResponse.json({ error: 'Фонова обробка вже запущена' }, { status: 409 });
      }
      const targets = Array.isArray(body.products) ? body.products.filter(p => p?.id && p?.image_url) : [];
      if (targets.length === 0) {
        return NextResponse.json({ error: 'Немає товарів для обробки' }, { status: 400 });
      }

      const aspectRatio = body.aspectRatio || '1:1';
      const keepReferenceInGallery = body.keepReferenceInGallery !== false;

      // Fire-and-forget on the server! Browser stays 100% responsive.
      runBackgroundBatch(targets, { aspectRatio, keepReferenceInGallery }).catch(err => {
        console.error('Background batch crashed:', err);
        globalStore.running = false;
      });

      return NextResponse.json({ started: true, total: targets.length });
    }

    return NextResponse.json({ error: 'Невідома дія' }, { status: 400 });
  } catch (error) {
    console.error('Studio batch route error:', error);
    return NextResponse.json({ error: error.message || 'Внутрішня помилка' }, { status: 500 });
  }
}
