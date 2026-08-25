import { NextResponse } from 'next/server';
import { KNOWLEDGE_BASE } from '@/lib/knowledge-base';
import { AI_TOOLS, executeAiTool } from '@/lib/ai-tools';
import Groq from 'groq-sdk';

export async function POST(request: Request) {
  try {
    const { transcript, language, residentName } = await request.json();

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    const kbContext = JSON.stringify(KNOWLEDGE_BASE, null, 2);

    const systemPrompt = `You are "MediAssist" — an autonomous, highly intelligent Medical AGI for elderly residents in Indian old-age homes. You have tools available to fetch resident profiles, log symptoms, and trigger emergency alerts.

CORE BEHAVIOR PROTOCOL:
- You MUST ACT on the user's input using your tools if needed (e.g. check their profile before giving medication advice, or trigger an emergency if they report falling).
- You are strictly bound to brevity. Your spoken audio response MUST BE UNDER 2 SENTENCES (max 150 characters). Do NOT give page-filling answers. Be concise, direct, and reassuring.
- Think before you act or speak.

LANGUAGE & SCRIPT RULES:
- You MUST respond in ${language || 'Marathi'} language ONLY.
- If language is Marathi: \`audio_response\` MUST be 100% in pure Marathi using DEVANAGARI SCRIPT (मराठी).
- If language is Hindi: \`audio_response\` MUST be 100% in pure Hindi using DEVANAGARI SCRIPT (हिंदी).
- NEVER mix English words into the spoken response for Marathi/Hindi.
- Address the resident warmly by name: "${residentName || 'Resident'}".

WORKSPACE KNOWLEDGE BASE & CLINICAL SOPS:
${kbContext}`;

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // ════════════════════════════════════════════════════
    // LAYER 1: Groq (openai/gpt-oss-120b) with Tool Calling
    // ════════════════════════════════════════════════════
    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const model = 'openai/gpt-oss-120b';

        let messages: any[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Resident "${residentName || 'Resident'}" said: "${transcript}"` }
        ];

        let loopCount = 0;
        const maxLoops = 2;

        while (loopCount < maxLoops) {
          loopCount++;
          const response = await groq.chat.completions.create({
            model: model,
            messages: messages,
            tools: AI_TOOLS,
            tool_choice: "auto",
            temperature: 0.2,
            max_tokens: 1200,
          });

          const responseMessage = response.choices[0].message;
          const toolCalls = responseMessage.tool_calls;

          if (toolCalls && toolCalls.length > 0) {
            messages.push(responseMessage);
            for (const toolCall of toolCalls) {
              const functionName = toolCall.function.name;
              const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
              console.log(`[AGI Agent] Executing Tool: ${functionName}`, functionArgs);
              const toolResult = await executeAiTool(functionName, functionArgs);
              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                name: functionName,
                content: toolResult,
              });
            }
          } else {
            messages.push(responseMessage);
            messages.push({
              role: "user",
              content: `Now, output ONLY a JSON object with:
{
  "type": "emergency" | "symptom" | "general",
  "severity": "low" | "medium" | "high" | "critical",
  "audio_response": "Concise spoken response in 100% pure ${language || 'Marathi'} using Devanagari script. Maximum 2 short sentences.",
  "detailed_analysis": "Optional clinical advice in ${language || 'Marathi'}",
  "summary": "1-line English medical summary"
}`
            });

            const finalResponse = await groq.chat.completions.create({
              model: model,
              messages: messages,
              temperature: 0.2,
              max_tokens: 1200,
              response_format: { type: 'json_object' }
            });

            const rawJson = finalResponse.choices[0]?.message?.content || '';
            const parsed = extractJSON(rawJson);
            if (parsed && parsed.audio_response) {
              console.log(`[AGI Agent] Groq Success:`, parsed.audio_response);
              return NextResponse.json({ success: true, provider: 'groq-agentic-loop', ...parsed });
            }
            break;
          }
        }
      } catch (groqErr: any) {
        console.log('[AGI Agent] Groq Layer Error:', groqErr.message);
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 2: Google Gemini (gemini-3.6-flash / 3.7-flash) Fallback
    // ════════════════════════════════════════════════════
    if (geminiKey) {
      for (const gemModel of ['gemini-3.6-flash', 'gemini-3.7-flash']) {
        try {
          const gemPrompt = `${systemPrompt}\n\nResident "${residentName || 'Resident'}" said: "${transcript}"\n\nGenerate JSON response:
{
  "type": "emergency" | "symptom" | "general",
  "severity": "low" | "medium" | "high" | "critical",
  "audio_response": "Concise spoken response in 100% pure ${language || 'Marathi'} using Devanagari script. Maximum 2 short sentences.",
  "detailed_analysis": "Optional clinical advice in ${language || 'Marathi'}",
  "summary": "1-line English medical summary"
}`;

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${gemModel}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: gemPrompt }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2048,
                responseMimeType: "application/json"
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = extractJSON(rawText);
            if (parsed && parsed.audio_response) {
              console.log(`[AGI Agent] Gemini ${gemModel} Success:`, parsed.audio_response);
              return NextResponse.json({ success: true, provider: `gemini-${gemModel}`, ...parsed });
            }
          }
        } catch (gemErr: any) {
          console.log(`[AGI Agent] Gemini ${gemModel} Error:`, gemErr.message);
        }
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 3: Smart Keyword Fallback (Instant Offline Guarantee)
    // ════════════════════════════════════════════════════
    console.log('[AGI Agent] Using smart fallback layer.');
    return NextResponse.json({ success: true, provider: 'smart-fallback', ...smartFallback(transcript, language || 'Marathi', residentName || 'Resident') });

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
