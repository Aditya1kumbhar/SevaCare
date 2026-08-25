import { NextResponse } from 'next/server';
import { retrieveContext } from '@/lib/rag';
import Groq from 'groq-sdk';

// ─── Single-shot LLM call with RAG context. No loops, no tool-calling. ───
export async function POST(request: Request) {
  try {
    const { transcript, language, residentName } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    // ─── RAG: retrieve only relevant knowledge ───
    let ragContext = '';
    try {
      ragContext = await retrieveContext(transcript, 3);
    } catch {
      // RAG unavailable — proceed without context, still works
    }

    const lang = language || 'Marathi';
    const name = residentName || 'Resident';
    const langInstruction = lang === 'Marathi'
      ? 'audio_response MUST be 100% Marathi in Devanagari (मराठी). NEVER use English words.'
      : lang === 'Hindi'
      ? 'audio_response MUST be 100% Hindi in Devanagari (हिंदी). NEVER use English words.'
      : 'audio_response MUST be clear English.';

    const systemPrompt = `You are MediAssist, a medical voice companion for elderly residents in an Indian old-age home.

RULES:
1. audio_response: 1-2 sentences ONLY. Under 120 characters. ${langInstruction}
2. Address the resident as "${name}".
3. If unsure about medication, say "मी डॉक्टरांना कळवते" — NEVER guess dosages.
4. Emergencies (fall, chest pain, breathing, bleeding, unconscious): set type=emergency, tell them help is coming.
5. Do NOT give long explanations. Be warm, direct, done.

${ragContext ? `RELEVANT MEDICAL CONTEXT:\n${ragContext}` : ''}

EXAMPLES:
User: "मला डोकेदुखी आहे"
→ {"type":"symptom","severity":"low","audio_response":"${name}, विश्रांती घ्या आणि पाणी प्या. डॉक्टरांना कळवते.","summary":"Headache reported"}

User: "मी पडलो, खूप दुखतंय"
→ {"type":"emergency","severity":"high","audio_response":"${name}, हलू नका! मदत लगेच येत आहे.","summary":"Fall with pain reported"}

User: "आज कसे आहात?"
→ {"type":"general","severity":"low","audio_response":"${name}, मी ठीक आहे! तुम्हाला काही मदत हवी का?","summary":"General greeting"}`;

    const userMessage = `Resident "${name}" said: "${transcript}"

Respond with a JSON object: {"type","severity","audio_response","summary"}`;

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // ════════════════════════════════════════════════════
    // LAYER 1: Gemini Flash (free tier, best Marathi, structured JSON)
    // ════════════════════════════════════════════════════
    if (geminiKey) {
      for (const model of ['gemini-1.5-flash']) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 300,
                  responseMimeType: 'application/json',
                },
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = extractJSON(rawText);
            if (parsed?.audio_response) {
              parsed.audio_response = truncateAudio(parsed.audio_response);
              console.log(`[AI] ${model} →`, parsed.audio_response);
              return NextResponse.json({ success: true, provider: model, ...parsed });
            }
          }
        } catch (e: any) {
          console.log(`[AI] ${model} error:`, e.message);
        }
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 2: Groq (free, fast inference)
    // ════════════════════════════════════════════════════
    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const completion = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2,
          max_tokens: 300,
          response_format: { type: 'json_object' },
        });

        const rawJson = completion.choices[0]?.message?.content || '';
        const parsed = extractJSON(rawJson);
        if (parsed?.audio_response) {
          parsed.audio_response = truncateAudio(parsed.audio_response);
          console.log('[AI] Groq →', parsed.audio_response);
          return NextResponse.json({ success: true, provider: 'groq', ...parsed });
        }
      } catch (e: any) {
        console.log('[AI] Groq error:', e.message);
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 3: Keyword fallback (offline guarantee)
    // ════════════════════════════════════════════════════
    console.log('[AI] All LLMs failed → keyword fallback');
    return NextResponse.json({
      success: true,
      provider: 'keyword-fallback',
      ...keywordFallback(transcript, lang, name),
    });
  } catch (error: any) {
    console.error('[AI] Fatal error:', error);
    return NextResponse.json({ error: 'Failed to process', details: error.message }, { status: 500 });
  }
}

// ─── Backend truncation: cut audio_response at last sentence ≤150 chars ───
function truncateAudio(text: string): string {
  if (text.length <= 150) return text;
  // Find last sentence-ending punctuation within 150 chars
  const cut = text.substring(0, 150);
  const lastPeriod = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('।'), cut.lastIndexOf('!'));
  return lastPeriod > 30 ? cut.substring(0, lastPeriod + 1) : cut + '…';
}

function extractJSON(text: string): any {
  try {
    const i = text.indexOf('{');
    const j = text.lastIndexOf('}');
    if (i !== -1 && j > i) return JSON.parse(text.substring(i, j + 1));
  } catch {}
  return null;
}

// ─── Hardcoded keyword fallback (always works, zero latency) ───
function keywordFallback(transcript: string, language: string, name: string) {
  const t = (transcript + ' ' + transcript.toLowerCase());
  const lang = language.toLowerCase();

  const emergency = ['fall','fell','chest pain','heart','breathing','unconscious','bleeding','emergency','choking','stroke','fracture','ambulance','गिर','छाती','दर्द','सांस','बेहोश','खून','मदद','बचाओ','पडल','छातीत','श्वास','बेशुद्ध','रक्त','मदत','आणीबाणी','वेदना'];
  const symptom = ['fever','headache','dizzy','nausea','vomit','cough','weakness','pain','stomach','medicine','doctor','बुखार','सिरदर्द','चक्कर','उल्टी','खांसी','कमजोरी','पेट','दवाई','डॉक्टर','ताप','डोकेदुखी','मळमळ','खोकला','अशक्तपणा','पोट','आजारी','औषध'];

  const isEmergency = emergency.some(w => t.includes(w));
  const isSymptom = !isEmergency && symptom.some(w => t.includes(w));

  if (isEmergency) {
    const audio_response = lang === 'marathi'
      ? `${name}, शांत राहा! मदत लगेच येत आहे.`
      : lang === 'hindi'
      ? `${name} जी, शांत रहें! मदद तुरंत आ रही है।`
      : `${name}, stay calm! Help is on the way.`;
    return { type: 'emergency', severity: 'high', audio_response, summary: `Emergency: ${transcript.substring(0, 60)}` };
  }

  if (isSymptom) {
    const audio_response = lang === 'marathi'
      ? `${name}, मी नोंद घेतली. विश्रांती घ्या, डॉक्टरांना कळवते.`
      : lang === 'hindi'
      ? `${name} जी, नोट कर लिया। आराम करें, डॉक्टर को बताते हैं।`
      : `${name}, noted. Please rest, I'll inform the doctor.`;
    return { type: 'symptom', severity: 'medium', audio_response, summary: `Symptom: ${transcript.substring(0, 60)}` };
  }

  const audio_response = lang === 'marathi'
    ? `${name}, मी ऐकलं. काही मदत हवी का?`
    : lang === 'hindi'
    ? `${name} जी, सुन लिया। कोई मदद चाहिए?`
    : `${name}, I heard you. Need any help?`;
  return { type: 'general', severity: 'low', audio_response, summary: `General: ${transcript.substring(0, 60)}` };
}
