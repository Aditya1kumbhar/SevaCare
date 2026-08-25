import { NextResponse } from 'next/server';
import { retrieveContext } from '@/lib/rag';
import Groq from 'groq-sdk';

// ─── Fast, single-shot LLM with layered fallback and strict brevity ───
export async function POST(request: Request) {
  try {
    const { transcript, language, residentName } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const lang = language || 'Marathi';
    const name = residentName || 'Resident';
    const langInstruction = lang === 'Marathi'
      ? 'audio_response MUST be 100% Marathi in Devanagari (मराठी). NEVER use English words.'
      : lang === 'Hindi'
      ? 'audio_response MUST be 100% Hindi in Devanagari (हिंदी). NEVER use English words.'
      : 'audio_response MUST be clear English.';

    // ─── Fast RAG (non-blocking, max 1.5s) ───
    let ragContext = '';
    try {
      ragContext = await retrieveContext(transcript, 3);
    } catch {
      // RAG unavailable — proceed without context
    }

    const systemPrompt = `You are MediAssist, an intelligent and empathetic medical voice companion for elderly residents in an Indian old-age home.

STRICT RULES:
1. audio_response: 1 to 2 short sentences ONLY. Under 120 characters total. ${langInstruction}
2. Address the resident warmly as "${name}".
3. If unsure about medicine dosages, say "मी डॉक्टरांना कळवते" — NEVER guess dosages.
4. Emergencies (fall, chest pain, dizziness, severe pain, breathing, unconscious): set type=emergency, severity=high, tell them help is coming immediately.
5. Symptoms (pain, fever, headache, nausea): set type=symptom, severity=medium, reassure them and log it.
6. Do NOT write long paragraphs. Output concise JSON.

${ragContext ? `CLINICAL KNOWLEDGE BASE:\n${ragContext}` : ''}

EXAMPLES:
User: "माझे पाय दुखत आहेत"
→ {"type":"symptom","severity":"medium","audio_response":"${name}, विश्रांती घ्या आणि पाय थोडे वर ठेवा. मी डॉक्टरांना सांगते.","summary":"Leg pain reported"}

User: "मला चक्कर येत आहे आणि वेदना होत आहेत"
→ {"type":"emergency","severity":"high","audio_response":"${name}, ताबडतोब खाली बसा आणि शांत राहा! मदत लगेच येत आहे.","summary":"Dizziness and acute pain reported"}

User: "आज कसे आहात?"
→ {"type":"general","severity":"low","audio_response":"${name}, मी ठीक आहे! तुम्हाला आज काही मदत हवी का?","summary":"General greeting"}`;

    const userMessage = `Resident "${name}" says: "${transcript}"

Generate JSON response with format: {"type":"emergency"|"symptom"|"general","severity":"low"|"medium"|"high","audio_response":"...","summary":"..."}`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // ════════════════════════════════════════════════════
    // LAYER 1: Groq (ultra-fast 1s inference with openai/gpt-oss-120b)
    // ════════════════════════════════════════════════════
    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const completion = await groq.chat.completions.create({
          model: 'openai/gpt-oss-120b',
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
          console.log('[AI] Groq (gpt-oss-120b) Success:', parsed.audio_response);
          return NextResponse.json({ success: true, provider: 'groq-120b', ...parsed });
        }
      } catch (e: any) {
        console.log('[AI] Groq error, trying Gemini:', e.message);
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 2: Google Gemini (gemini-3.5-flash-lite / gemini-3.5-flash / gemini-3.6-flash)
    // ════════════════════════════════════════════════════
    if (geminiKey) {
      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'];
      for (const model of candidateModels) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 3500);

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
              signal: controller.signal
            }
          );
          clearTimeout(timer);

          if (res.ok) {
            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = extractJSON(rawText);
            if (parsed?.audio_response) {
              parsed.audio_response = truncateAudio(parsed.audio_response);
              console.log(`[AI] ${model} Success:`, parsed.audio_response);
              return NextResponse.json({ success: true, provider: model, ...parsed });
            }
          }
        } catch (e: any) {
          console.log(`[AI] ${model} error:`, e.message);
        }
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 3: Smart Keyword Fallback (0ms instant response)
    // ════════════════════════════════════════════════════
    console.log('[AI] Using keyword fallback layer.');
    return NextResponse.json({
      success: true,
      provider: 'keyword-fallback',
      ...keywordFallback(transcript, lang, name),
    });
  } catch (error: any) {
    console.error('[AI] Fatal error:', error);
    return NextResponse.json({
      success: true,
      provider: 'emergency-fallback',
      type: 'general',
      severity: 'low',
      audio_response: 'मी नोंद घेतली आहे. विश्रांती घ्या.',
      summary: 'Fallback triggered'
    });
  }
}

// ─── Backend truncation: cut audio_response at last sentence ≤150 chars ───
function truncateAudio(text: string): string {
  if (text.length <= 150) return text;
  const cut = text.substring(0, 150);
  const lastPeriod = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('।'), cut.lastIndexOf('!'), cut.lastIndexOf('?'));
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

// ─── Hardcoded keyword fallback ───
function keywordFallback(transcript: string, language: string, name: string) {
  const t = (transcript + ' ' + transcript.toLowerCase());
  const lang = language.toLowerCase();

  const emergency = ['fall','fell','chest pain','heart','breathing','unconscious','bleeding','emergency','choking','stroke','fracture','ambulance','चक्कर','पडलो','पडले','छातीत','श्वास','बेशुद्ध','रक्त','मदत','आणीबाणी','वेदना','तातडीने','गिर','दर्द','सांस','बेहोश','खून'];
  const symptom = ['fever','headache','dizzy','nausea','vomit','cough','weakness','pain','stomach','medicine','doctor','पाय','ताप','डोकेदुखी','मळमळ','खोकला','अशक्तपणा','पोट','आजारी','औषध','दुखत','बुखार','सिरदर्द','उल्टी','खांसी'];

  const isEmergency = emergency.some(w => t.includes(w));
  const isSymptom = !isEmergency && symptom.some(w => t.includes(w));

  if (isEmergency) {
    const audio_response = lang === 'marathi'
      ? `${name}, शांत राहा आणि ताबडतोब बसा! मदत लगेच येत आहे.`
      : lang === 'hindi'
      ? `${name} जी, शांत रहें और तुरंत बैठ जाएं! मदद आ रही है।`
      : `${name}, please sit down and stay calm! Help is on the way.`;
    return { type: 'emergency', severity: 'high', audio_response, summary: `Emergency: ${transcript.substring(0, 60)}` };
  }

  if (isSymptom) {
    const audio_response = lang === 'marathi'
      ? `${name}, मी नोंद घेतली आहे. थोडी विश्रांती घ्या, डॉक्टरांना कळवते.`
      : lang === 'hindi'
      ? `${name} जी, मैंने नोट कर लिया है। थोड़ा आराम करें, डॉक्टर को बताते हैं।`
      : `${name}, noted. Please rest, I will notify the physician.`;
    return { type: 'symptom', severity: 'medium', audio_response, summary: `Symptom: ${transcript.substring(0, 60)}` };
  }

  const audio_response = lang === 'marathi'
    ? `${name}, मी तुमचे ऐकले. तुम्हाला काही मदत हवी आहे का?`
    : lang === 'hindi'
    ? `${name} जी, मैंने सुन लिया। क्या आपको कोई मदद चाहिए?`
    : `${name}, I am here with you. How can I help?`;
  return { type: 'general', severity: 'low', audio_response, summary: `General: ${transcript.substring(0, 60)}` };
}
