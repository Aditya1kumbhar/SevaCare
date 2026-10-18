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

    const { transcript, language, residentName, history, residentProfile } = await request.json();

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json({ error: 'Valid transcript string is required' }, { status: 400 });
    }

    const cleanTranscript = transcript.trim().slice(0, 500);
    if (!cleanTranscript) {
      return NextResponse.json({ error: 'Transcript cannot be empty' }, { status: 400 });
    }

    const lang = typeof language === 'string' ? language : 'Marathi';
    const name = typeof residentName === 'string' ? residentName : 'Resident';

    // Zero-trust sanitization for conversation history
    const sanitizedHistory: Array<{ role: 'user' | 'assistant'; content: string }> = Array.isArray(history)
      ? history
          .filter((h: any) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
          .slice(-6)
          .map((h: any) => ({
            role: h.role,
            content: String(h.content).trim().slice(0, 300)
          }))
      : [];

    // Optional profile sanitization
    const profile = residentProfile && typeof residentProfile === 'object' ? {
      age: typeof residentProfile.age === 'number' ? residentProfile.age : undefined,
      room_number: typeof residentProfile.room_number === 'string' ? residentProfile.room_number.slice(0, 20) : undefined,
      mobility_status: typeof residentProfile.mobility_status === 'string' ? residentProfile.mobility_status.slice(0, 50) : undefined,
      life_threatening_allergies: typeof residentProfile.life_threatening_allergies === 'string' ? residentProfile.life_threatening_allergies.slice(0, 100) : undefined
    } : undefined;

    const result = await processClinicalVoicePrompt(cleanTranscript, lang, name, sanitizedHistory, profile);

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
      audio_response: 'I have noted your message and alerted our care team to check in with you.',
      summary: 'Emergency safe fallback triggered'
    });
  }
}
