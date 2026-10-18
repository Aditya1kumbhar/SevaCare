import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processClinicalVoicePrompt } from '@/lib/clinical-ai';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, language, residentName } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Valid transcript string is required' }, { status: 400 });
    }

    const cleanTranscript = transcript.trim().slice(0, 500);
    if (!cleanTranscript) {
      return NextResponse.json({ error: 'Transcript cannot be empty' }, { status: 400 });
    }

    const lang = typeof language === 'string' ? language : 'Marathi';
    const name = typeof residentName === 'string' ? residentName : 'Resident';

    const result = await processClinicalVoicePrompt(cleanTranscript, lang, name);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[AI] Clinical processing error:', error);
    return NextResponse.json({
      success: true,
      provider: 'emergency-fallback',
      model: 'fail-safe-v1',
      type: 'general',
      severity: 'low',
      protocol_triggered: 'FAIL_SAFE',
      immediate_action: 'NOTIFY_CARETAKER',
      audio_response: 'मी नोंद घेतली आहे. विश्रांती घ्या, कर्मचारी लगेच येत आहेत.',
      summary: 'Fallback triggered'
    });
  }
}
