import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';

export async function POST(request: Request) {
  try {
    const { text, lang } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Default to Marathi if not specified
    const languageCode = lang || 'mr';

    // Get base64 encoded audio strings for the text
    // This automatically handles chunking for long texts (> 200 chars)
    const results = await googleTTS.getAllAudioBase64(text, {
      lang: languageCode,
      slow: false,
      host: 'https://translate.google.com',
      splitPunc: '।.,?!',
    });

    // Return the array of base64 chunks
    return NextResponse.json({
      success: true,
      audioChunks: results.map(r => r.base64)
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
