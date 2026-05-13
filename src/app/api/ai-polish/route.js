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

    // Step 1: Remove background using Hugging Face (RMBG-1.4)
    // We need to send raw bytes to the Inference API
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
      // If the model is loading, it returns a specific JSON
      if (errorText.includes("is currently loading")) {
        throw new Error("ШІ-модель завантажується... Будь ласка, спробуйте ще раз через 20 секунд.");
      }
      throw new Error(`Hugging Face error: ${errorText}`);
    }

    // Hugging Face returns the image as a blob
    const blob = await hfResponse.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    // Note: Since we don't have a background generation step here for free,
    // we return the transparent PNG.
    return NextResponse.json({ imageUrl: base64Image });

  } catch (error) {
    console.error('AI Polish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
