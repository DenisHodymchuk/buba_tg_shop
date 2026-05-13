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
    // This model returns a transparent PNG
    const hfResponse = await fetch(
      "https://api-inference.huggingface.co/models/briaai/RMBG-1.4",
      {
        headers: { Authorization: `Bearer ${hfToken}` },
        method: "POST",
        body: JSON.stringify({ inputs: imageUrl }),
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      throw new Error(`Hugging Face error: ${errorText}`);
    }

    // Hugging Face returns the image as a blob
    const blob = await hfResponse.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    // Note: Since we don't have a background generation step here for free,
    // we return the transparent PNG. The storefront will display it nicely on its dark background.
    return NextResponse.json({ imageUrl: base64Image });

  } catch (error) {
    console.error('AI Polish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
