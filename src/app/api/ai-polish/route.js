import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json({ error: 'Cloudinary configuration missing' }, { status: 500 });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // Step 1: Upload to Cloudinary with background removal
    // Note: This requires the "Cloudinary AI Background Removal" add-on (Free tier available)
    const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
      background_removal: "cloudinary_ai", // Try specialized AI removal
      folder: "buba_products_ai",
    });

    // Step 2: If we want to add the specific studio background, 
    // we can use Cloudinary transformations
    const transformedUrl = cloudinary.url(uploadResponse.public_id, {
      effect: "bgremoval", // Fallback/Alternative effect
      secure: true,
    });

    // We return the secure URL with background removal applied
    // Cloudinary processing is asynchronous if it's a first-time heavy transformation,
    // but usually returns a URL that will be ready in a moment.
    return NextResponse.json({ imageUrl: uploadResponse.secure_url });

  } catch (error) {
    console.error('Cloudinary Polish error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
