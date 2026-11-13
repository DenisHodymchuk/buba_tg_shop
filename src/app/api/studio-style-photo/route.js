import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const DEFAULT_DARK_STUDIO_PROMPT =
  'Place the exact 3D-printed object from the reference image centered on a sleek matte dark graphite slate studio pedestal (#161822) against a seamless dark charcoal studio backdrop (#0F1117). Soft diffused overhead key light with subtle cool periwinkle rim light, realistic soft contact shadow beneath the object, clean commercial e-commerce product photography. Preserve the exact shape, proportions, surface texture, colors, and all details of the 3D-printed object without altering or distorting it.';

export async function POST(req) {
  try {
    const falKey = process.env.FAL_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: 'FAL_KEY не налаштовано в змінних середовища (.env.local)' },
        { status: 500 }
      );
    }

    const { imageUrl, customPrompt, aspectRatio = '1:1' } = await req.json();

    if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) {
      return NextResponse.json({ error: 'Некоректне посилання на фото' }, { status: 400 });
    }

    const prompt = (customPrompt || '').trim() || DEFAULT_DARK_STUDIO_PROMPT;

    const falResponse = await fetch('https://fal.run/fal-ai/flux-pro/kontext', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        image_url: imageUrl,
        aspect_ratio: aspectRatio,
        guidance_scale: 3.5,
        output_format: 'jpeg'
      })
    });

    if (!falResponse.ok) {
      const errText = await falResponse.text();
      console.error('fal.ai error:', falResponse.status, errText);
      return NextResponse.json(
        { error: `Помилка fal.ai (${falResponse.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const falData = await falResponse.json();
    const generatedUrl = falData?.images?.[0]?.url;

    if (!generatedUrl) {
      return NextResponse.json(
        { error: 'ШІ не повернув зображення' },
        { status: 502 }
      );
    }

    // Persist generated image to Supabase Storage so it never expires
    let finalUrl = generatedUrl;
    if (supabase) {
      try {
        const imgRes = await fetch(generatedUrl);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const arrayBuffer = await imgRes.arrayBuffer();
          const fileName = `studio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, arrayBuffer, { contentType, upsert: false });

          if (!uploadError) {
            const { data: pub } = supabase.storage.from('products').getPublicUrl(fileName);
            if (pub?.publicUrl) {
              finalUrl = pub.publicUrl;
            }
          } else {
            console.warn('Supabase storage upload failed, using fal URL:', uploadError.message);
          }
        }
      } catch (storageErr) {
        console.warn('Supabase persist skipped:', storageErr.message);
      }
    }

    return NextResponse.json({ url: finalUrl });
  } catch (error) {
    console.error('Studio style photo error:', error);
    return NextResponse.json(
      { error: error.message || 'Внутрішня помилка сервера' },
      { status: 500 }
    );
  }
}
