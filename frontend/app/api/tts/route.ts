import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';

export async function POST(request: Request) {
  try {
    const { text, lang } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const languageCode = lang || 'mr';

    // Strip markdown formatting, extra asterisks, and emojis for clean TTS
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_#`~]/g, '')
      .trim();

    // Generate direct audio URLs (client=tw-ob)
    // Handled natively by browser <audio> without server-side 403 blocks
    const results = googleTTS.getAllAudioUrls(cleanText, {
      lang: languageCode,
      slow: false,
      host: 'https://translate.google.com',
      splitPunc: '।.,?!',
    });

    return NextResponse.json({
      success: true,
      audioUrls: results.map(r => r.url)
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
