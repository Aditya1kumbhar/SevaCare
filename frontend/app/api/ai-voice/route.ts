import { NextResponse } from 'next/server';

// ─── Groq (Llama 3.3 70B) → Gemini → Smart Fallback ───
export async function POST(request: Request) {
  try {
    const { transcript, language, residentName } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const systemPrompt = `You are SevaCare AI — a warm, caring, expert medical voice assistant for elderly residents in Indian old-age homes.

CRITICAL RULES:
- You MUST respond in ${language || 'English'} language ONLY.
- If language is Marathi: respond ENTIRELY in Marathi using DEVANAGARI SCRIPT (मराठी). Example: "तुम्हाला ताप आला आहे, कृपया विश्रांती घ्या."
- If language is Hindi: respond ENTIRELY in Hindi using DEVANAGARI SCRIPT (हिंदी). Example: "आप आराम करें, मैंने डॉक्टर को बुला लिया है."
- If language is English: respond in English.
- NEVER use transliteration or Roman script for Hindi/Marathi. ALWAYS use Devanagari (देवनागरी).
- Be compassionate, warm, and reassuring like a loving family member.
- For emergencies: respond with URGENT instructions and confirm help is being sent.
- For symptoms: give immediate comfort advice and confirm the doctor has been notified.
- For general queries: be helpful and warm, never dismissive.
- Keep audio_response to 1-2 sentences max (it will be spoken aloud to an elderly person).
- Address the resident by name: "${residentName || 'Resident'}"`;

    const userMessage = `Resident "${residentName || 'Resident'}" said: "${transcript}"

Classify and respond. Return ONLY valid JSON, no markdown, no explanation:
{"type":"emergency"|"symptom"|"general","severity":"low"|"medium"|"high"|"critical","keywords":["extracted symptoms in English"],"audio_response":"compassionate response in ${language || 'English'}","summary":"1-line English medical summary for caretaker log"}`;

    // ════════════════════════════════════════════════════
    // LAYER 1: Groq (Llama 3.3 70B) — PRIMARY (ultra-fast ~0.1s)
    // ════════════════════════════════════════════════════
    const groqKey = process.env.GROQ_API_KEY;

    if (groqKey) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.3,
            max_tokens: 400,
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const rawText = result.choices?.[0]?.message?.content || '';
          const parsed = extractJSON(rawText);
          if (parsed) {
            console.log('[AI] Groq/Llama response OK');
            return NextResponse.json({ success: true, provider: 'groq-llama', ...parsed });
          }
        } else {
          const errText = await response.text().catch(() => '');
          console.log(`[AI] Groq returned ${response.status}: ${errText.substring(0, 200)}`);
        }
      } catch (e: any) {
        console.log('[AI] Groq error:', e.message);
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 2: Gemini — BACKUP
    // ════════════════════════════════════════════════════
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const prompt = `${systemPrompt}\n\n${userMessage}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 400, response_mime_type: "application/json" }
          })
        });

        if (response.ok) {
          const result = await response.json();
          const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = extractJSON(rawText);
          if (parsed) {
            console.log('[AI] Gemini response OK');
            return NextResponse.json({ success: true, provider: 'gemini', ...parsed });
          }
        }
      } catch (e: any) {
        console.log('[AI] Gemini error:', e.message);
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 3: Smart Keyword Fallback (always works, offline)
    // ════════════════════════════════════════════════════
    console.log('[AI] Using keyword fallback');
    return NextResponse.json({ success: true, provider: 'fallback', ...smartFallback(transcript, language || 'English', residentName || 'Resident') });

  } catch (error: any) {
    console.log('Error in AI Voice API:', error);
    return NextResponse.json({ error: 'Failed to process', details: error.message }, { status: 500 });
  }
}

// ─── Extract JSON from LLM output ───
function extractJSON(text: string): any {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
  } catch {}
  return null;
}

// ─── Smart Keyword Fallback ───
function smartFallback(transcript: string, language: string, residentName: string) {
  const text = transcript.toLowerCase();
  const lang = language.toLowerCase();

  const emergencyWords = [
    'fall', 'fell', 'fallen', 'chest pain', 'heart', 'attack', 'breathing', 'breathe',
    'unconscious', 'bleeding', 'blood', 'emergency', 'help', 'choking', 'stroke',
    'faint', 'fainted', 'collapse', 'serious', 'critical', 'dying', 'cant breathe',
    'broken', 'fracture', 'severe', 'ambulance',
    'गिर', 'गिरे', 'गिरा', 'छाती', 'दर्द', 'सांस', 'बेहोश', 'खून', 'मदद',
    'दिल', 'हमला', 'टूट', 'गंभीर', 'तकलीफ', 'बहुत दर्द', 'बचाओ',
    'पडल', 'पडले', 'छातीत', 'दुखणे', 'श्वास', 'बेशुद्ध', 'रक्त', 'मदत',
    'आणीबाणी', 'हृदय', 'तुटले', 'गंभीर', 'वेदना'
  ];

  const symptomWords = [
    'fever', 'headache', 'dizzy', 'dizziness', 'nausea', 'vomit', 'cough', 'cold',
    'weakness', 'weak', 'tired', 'pain', 'ache', 'sore', 'stomach', 'back pain',
    'knee', 'joint', 'swelling', 'rash', 'temperature', 'chills', 'throat', 'ear',
    'not feeling well', 'feeling sick', 'unwell', 'medicine', 'tablet', 'doctor',
    'बुखार', 'सिरदर्द', 'चक्कर', 'उल्टी', 'खांसी', 'जुकाम', 'कमजोरी', 'थकान',
    'पेट', 'कमर', 'घुटना', 'सूजन', 'गला', 'तबियत', 'बीमार', 'दवाई', 'डॉक्टर',
    'ताप', 'डोकेदुखी', 'मळमळ', 'खोकला', 'सर्दी', 'अशक्तपणा', 'थकवा',
    'पोट', 'कंबर', 'गुडघा', 'सूज', 'घसा', 'आजारी', 'औषध'
  ];

  const isEmergency = emergencyWords.some(w => text.includes(w) || transcript.includes(w));
  const isSymptom = !isEmergency && symptomWords.some(w => text.includes(w) || transcript.includes(w));

  if (isEmergency) {
    const keywords = emergencyWords.filter(w => text.includes(w) || transcript.includes(w)).slice(0, 4);
    let audio_response = '';
    if (lang === 'marathi') {
      audio_response = `${residentName}, शांत राहा! मी आपत्कालीन मदत पाठवली आहे, कोणीतरी लगेच येत आहे!`;
    } else if (lang === 'hindi') {
      audio_response = `${residentName} जी, शांत रहें! मैंने आपातकालीन टीम को अलर्ट भेज दिया है, मदद तुरंत आ रही है!`;
    } else {
      audio_response = `${residentName}, please stay calm! I've alerted the emergency team, help is arriving immediately!`;
    }
    return { type: 'emergency', severity: 'high', keywords, audio_response, summary: `Emergency: ${transcript}` };
  }

  if (isSymptom) {
    const keywords = symptomWords.filter(w => text.includes(w) || transcript.includes(w)).slice(0, 4);
    let audio_response = '';
    if (lang === 'marathi') {
      audio_response = `${residentName}, मी तुमची लक्षणे नोंदवली आहेत. कृपया विश्रांती घ्या, डॉक्टर लवकरच तुम्हाला भेटतील.`;
    } else if (lang === 'hindi') {
      audio_response = `${residentName} जी, मैंने आपके लक्षण दर्ज कर लिए हैं। कृपया आराम करें, डॉक्टर जल्द ही आपको देखेंगे।`;
    } else {
      audio_response = `${residentName}, I've recorded your symptoms. Please rest comfortably, the doctor will see you shortly.`;
    }
    return { type: 'symptom', severity: 'medium', keywords, audio_response, summary: `Symptom: ${transcript}` };
  }

  let audio_response = '';
  if (lang === 'marathi') {
    audio_response = `${residentName}, मी तुमचे ऐकले आहे. मी आता एका केअरटेकरला बोलावतो जे तुम्हाला मदत करतील.`;
  } else if (lang === 'hindi') {
    audio_response = `${residentName} जी, मैंने आपकी बात सुन ली है। मैं अभी किसी केयरटेकर को बुलाता हूं जो आपकी मदद करेंगे।`;
  } else {
    audio_response = `${residentName}, I've heard you. Let me get a caretaker who can help you with that right away.`;
  }
  return { type: 'general', severity: 'low', keywords: ['general'], audio_response, summary: `General: ${transcript}` };
}
