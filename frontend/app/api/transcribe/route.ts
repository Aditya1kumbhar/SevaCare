import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  let file: File | null = null;
  let langCode = 'mr';

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    file = formData.get('file') as File | null;
    const language = (formData.get('language') as string) || 'Marathi';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const langLower = language.toLowerCase();
    langCode = (langLower.startsWith('mr') || langLower === 'marathi')
      ? 'mr'
      : (langLower.startsWith('hi') || langLower === 'hindi')
      ? 'hi'
      : 'en';

    const groqKey = process.env.GROQ_API_KEY;

    // ─── TIER 1: Groq Whisper-large-v3 (Ultra-Fast 300ms) ───
    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
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
          provider: 'groq-whisper',
          text: transcription.text?.trim() || '',
          language: langCode
        });
      } catch (groqErr: any) {
        console.warn('Groq Whisper error, attempting Hugging Face fallback:', groqErr.message);
      }
    }

    // ─── TIER 2: Hugging Face Pre-Trained Whisper-large-v3 ───
    const hfToken = process.env.HF_TOKEN;
    if (hfToken && file) {
      try {
        const { HfInference } = await import('@huggingface/inference');
        const hf = new HfInference(hfToken);
        const arrayBuffer = await file.arrayBuffer();
        const hfResult = await hf.automaticSpeechRecognition({
          model: 'openai/whisper-large-v3',
          data: arrayBuffer,
        });
        if (hfResult?.text) {
          return NextResponse.json({
            success: true,
            provider: 'huggingface-whisper',
            text: hfResult.text.trim(),
            language: langCode,
          });
        }
      } catch (hfErr: any) {
        console.warn('Hugging Face Whisper also failed:', hfErr.message);
      }
    }

    return NextResponse.json({ error: 'Speech transcription service unavailable' }, { status: 503 });
  } catch (error: any) {
    console.error('Transcription route fatal error:', error);
    return NextResponse.json({ error: error.message || 'Transcription failed' }, { status: 500 });
  }
}
