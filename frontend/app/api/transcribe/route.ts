import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const language = (formData.get('language') as string) || 'Marathi';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 });
    }

    const groq = new Groq({ apiKey: groqKey });

    const langLower = language.toLowerCase();
    const langCode = (langLower.startsWith('mr') || langLower === 'marathi')
      ? 'mr'
      : (langLower.startsWith('hi') || langLower === 'hindi')
      ? 'hi'
      : 'en';

    // Groq Whisper-large-v3 for hyper-accurate Marathi, Hindi, and English transcription
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3',
      language: langCode,
      temperature: 0.0,
      response_format: 'json',
      prompt: langCode === 'mr' 
        ? 'मराठी आरोग्य आणि आपत्कालीन वैद्यकीय संवाद'
        : langCode === 'hi'
        ? 'हिंदी स्वास्थ्य और आपातकालीन चिकित्सा सहायता'
        : 'Medical healthcare and emergency assistance'
    });

    return NextResponse.json({
      success: true,
      text: transcription.text?.trim() || '',
      language: langCode
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: error.message || 'Transcription failed' }, { status: 500 });
  }
}
