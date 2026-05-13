import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request) {
  try {
    const { productName, category } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured in .env.local' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Ти — експерт з маркетингу та копірайтингу для інтернет-магазину 3D-іграшок та механічних моделей "BUBA STORE". 
    Напиши привабливий, короткий та продаючий опис для товару: "${productName}" у категорії "${category}".
    Опис має бути українською мовою, містити емодзі, підкреслювати унікальність 3D-друку та якість виконання. 
    Обмежся 3-4 реченнями. Не використовуй загальні фрази, пиши конкретно про задоволення від володіння такою моделлю.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ description: text });

  } catch (error) {
    console.error('Gemini error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
