import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();
    const hfToken = process.env.HF_TOKEN;

    if (!hfToken) {
      return NextResponse.json({ error: 'HF_TOKEN not configured in .env.local' }, { status: 500 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Step 1: Remove background using Hugging Face
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error('Failed to fetch original image');
    const imageData = await imageRes.arrayBuffer();

    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
      {
        headers: { 
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/octet-stream"
        },
        method: "POST",
        body: imageData,
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      if (errorText.includes("Cannot POST") || hfResponse.status === 404) {
        throw new Error("ШІ-модель наразі недоступна безкоштовно на цьому сервері Hugging Face. Спробуйте пізніше або перейдіть на Cloudinary.");
      }
      if (errorText.includes("is currently loading")) {
        throw new Error("ШІ-модель завантажується... Спробуйте ще раз за 20 секунд.");
      }
      throw new Error(`Hugging Face error: ${errorText}`);
    }

    const blob = await hfResponse.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    return NextResponse.json({ imageUrl: base64Image });

  } catch (error) {
    console.error('AI Polish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
