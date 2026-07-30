import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';

export async function POST(request: Request) {
  try {
    const { text, lang } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const languageCode = lang || 'mr';

    // Clean text: strip markdown, extra spaces, emojis, and special chars
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_#`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit chunk to first 180 chars for ultra-fast, robust TTS generation
    const shortText = cleanText.length > 180 ? cleanText.substring(0, 180) + '...' : cleanText;

    // Generate base64 audio data URI directly
    const base64Audio = await googleTTS.getAudioBase64(shortText, {
      lang: languageCode,
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });

    const dataUri = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audioUrl: dataUri,
      audioChunks: [base64Audio]
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return NextResponse.json({ error: 'Failed to generate speech', details: error.message }, { status: 500 });
  }
}
