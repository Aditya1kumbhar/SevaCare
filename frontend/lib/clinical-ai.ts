/**
 * SevaCare Clinical Geriatric AI Intelligence Engine
 * Integrates Hugging Face Pre-Trained Foundation Models + Clinical SOPs
 */

import { HfInference } from '@huggingface/inference';
import Groq from 'groq-sdk';
import { retrieveContext } from './rag';

export interface ClinicalTriageResult {
  success: boolean;
  provider: string;
  model: string;
  type: 'emergency' | 'symptom' | 'general';
  severity: 'low' | 'medium' | 'high';
  protocol_triggered: string;
  immediate_action: string;
  audio_response: string;
  summary: string;
  clinical_triage_notes?: string;
}

// ─── Core Clinical Geriatric Knowledge System Prompt ───
export function buildClinicalSystemPrompt(
  name: string,
  language: string,
  ragContext: string = ''
): string {
  const lang = language.toLowerCase();
  const langRule = lang.startsWith('mr') || lang === 'marathi'
    ? 'audio_response: Reply in natural, warm Marathi (मराठी) in Devanagari script. If the resident addresses you or asks in English, reply in natural, compassionate English.'
    : lang.startsWith('hi') || lang === 'hindi'
    ? 'audio_response: Reply in natural, warm Hindi (हिंदी) in Devanagari script. If the resident addresses you or asks in English, reply in natural, compassionate English.'
    : 'audio_response MUST be clear, warm, compassionate English for an elder resident.';

  return `You are SevaCare Clinical AI, an expert geriatric medical companion for residents of elder care facilities in India. You possess deep clinical training in geriatrics, cardiovascular emergencies, stroke (BE-FAST), falls, diabetic care, dementia de-escalation, and medication safety.

STRICT CLINICAL PROTOCOLS:
1. ACUTE EMERGENCIES (Chest pain, sweating, stroke signs/facial droop/speech slurring, falls where resident cannot stand, severe breathlessness, unconsciousness):
   - type: "emergency", severity: "high"
   - protocol_triggered: "CARDIAC_TRIAGE" | "STROKE_BEFAST" | "FALL_ASSESSMENT" | "RESPIRATORY_DISTRESS"
   - immediate_action: "DISPATCH_108_NOTIFY_CARETAKER"
   - audio_response: Immediately instruct resident to remain seated/still, breathe calmly, and assure them help and staff are arriving right now.

2. ACUTE SYMPTOMS (Dizziness, fever, vomiting, shivering/hypoglycemia, sharp joint/belly pain):
   - type: "symptom", severity: "medium" | "high"
   - protocol_triggered: "HYPOGLYCEMIA_RULE15" | "FEBRILE_EVAL" | "HYPERTENSIVE_CHECK" | "SYMPTOM_TRIAGE"
   - immediate_action: "ALERT_CARETAKER_CHECK_VITALS"
   - audio_response: Reassure resident with medical empathy, give safe initial guidance (e.g. sip water, sit down, do not rush), and explain the caregiver is being notified.

3. MEDICATION SAFETY & DOSAGE INQUIRIES:
   - If resident asks to adjust, double, or skip doses, NEVER guess or approve dosage changes.
   - immediate_action: "REFER_TO_FACILITY_PHYSICIAN"
   - audio_response: Calmly state that medicine doses must only be modified by Dr. Kulkarni, and you will request him to review it.

4. DEMENTIA SUNSETTING / ANXIETY / LONELINESS:
   - type: "general", severity: "low"
   - protocol_triggered: "GERIATRIC_VALIDATION"
   - audio_response: Use soothing validation therapy. Never argue or dismiss feelings. Make them feel safe, heard, and cherished.

5. OUTPUT SPECIFICATION:
   - ${langRule}
   - audio_response: 1 to 2 warm, spoken sentences ONLY (max 160 characters). Do NOT read out markdown, bullet points, or JSON formatting.
   - Output must be strict JSON matching:
   {
     "type": "emergency" | "symptom" | "general",
     "severity": "low" | "medium" | "high",
     "protocol_triggered": "...",
     "immediate_action": "...",
     "audio_response": "...",
     "summary": "..."
   }

${ragContext ? `FACILITY CLINICAL KNOWLEDGE BASE:\n${ragContext}` : ''}`;
}

/**
 * Truncate audio response cleanly at sentence boundary (max 180 chars)
 */
export function truncateAudioResponse(text: string): string {
  if (text.length <= 180) return text;
  const cut = text.substring(0, 180);
  const lastPunctuation = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf('।'),
    cut.lastIndexOf('!'),
    cut.lastIndexOf('?')
  );
  return lastPunctuation > 40 ? cut.substring(0, lastPunctuation + 1) : cut.trim() + '…';
}

function extractJSON(text: string): any {
  try {
    const i = text.indexOf('{');
    const j = text.lastIndexOf('}');
    if (i !== -1 && j > i) {
      return JSON.parse(text.substring(i, j + 1));
    }
  } catch {}
  return null;
}

// ─── Main Clinical Inference Dispatcher ───
export async function processClinicalVoicePrompt(
  transcript: string,
  language: string = 'Marathi',
  residentName: string = 'Resident',
  history: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<ClinicalTriageResult> {
  const cleanTranscript = transcript.trim().slice(0, 500);
  const lang = language || 'Marathi';
  const name = residentName.replace(/["\\]/g, '').slice(0, 50);

  // Retrieve RAG Context (max 1.5s)
  let ragContext = '';
  try {
    ragContext = await retrieveContext(cleanTranscript, 3);
  } catch {
    // Proceed if RAG unavailable
  }

  const systemPrompt = buildClinicalSystemPrompt(name, lang, ragContext);
  const userPrompt = `Resident Name: "${name}"\n<resident_speech>\n${cleanTranscript}\n</resident_speech>\nExecute geriatric clinical evaluation. Return JSON only.`;

  const hfToken = process.env.HF_TOKEN;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // ════════════════════════════════════════════════════
  // TIER 1: Hugging Face Pre-Trained Foundation Models
  // Model: Qwen/Qwen2.5-72B-Instruct (Ranked #1 open clinical reasoning & Indic Devanagari)
  // ════════════════════════════════════════════════════
  if (hfToken) {
    try {
      const hf = new HfInference(hfToken);
      const hfMessages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-4).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: userPrompt },
      ];

      const hfResponse = await hf.chatCompletion({
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: hfMessages,
        temperature: 0.2,
        max_tokens: 350,
      });

      const raw = hfResponse.choices[0]?.message?.content || '';
      const parsed = extractJSON(raw);
      if (parsed?.audio_response) {
        return {
          success: true,
          provider: 'huggingface',
          model: 'Qwen/Qwen2.5-72B-Instruct',
          type: parsed.type || 'general',
          severity: parsed.severity || 'low',
          protocol_triggered: parsed.protocol_triggered || 'CLINICAL_EVAL',
          immediate_action: parsed.immediate_action || 'NOTIFY_CARETAKER',
          audio_response: truncateAudioResponse(parsed.audio_response),
          summary: parsed.summary || cleanTranscript.slice(0, 80),
          clinical_triage_notes: parsed.clinical_triage_notes,
        };
      }
    } catch (err: any) {
      console.warn('[ClinicalAI] Hugging Face inference failed, falling to Gemini/Groq:', err.message);
    }
  }

  // ════════════════════════════════════════════════════
  // TIER 2: Google Gemini Flash (gemini-3.8-flash, gemini-flash-latest)
  // ════════════════════════════════════════════════════
  if (geminiKey) {
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);

        const geminiContents = [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          },
          {
            role: 'model',
            parts: [{ text: '{"type": "general", "severity": "low", "audio_response": "Understood, I am ready to assist.", "summary": "System ready"}' }]
          },
          ...history.slice(-4).map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          })),
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ];

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: geminiContents,
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 800,
                responseMimeType: 'application/json',
              },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = extractJSON(raw);
          if (parsed?.audio_response) {
            return {
              success: true,
              provider: 'gemini',
              model,
              type: parsed.type || 'general',
              severity: parsed.severity || 'low',
              protocol_triggered: parsed.protocol_triggered || 'CLINICAL_EVAL',
              immediate_action: parsed.immediate_action || 'NOTIFY_CARETAKER',
              audio_response: truncateAudioResponse(parsed.audio_response),
              summary: parsed.summary || cleanTranscript.slice(0, 80),
              clinical_triage_notes: parsed.clinical_triage_notes,
            };
          } else {
            console.warn(`[ClinicalAI] Gemini ${model} returned unparseable response:`, raw);
          }
        } else {
          const errText = await res.text();
          console.warn(`[ClinicalAI] Gemini ${model} HTTP ${res.status}:`, errText);
        }
      } catch (err: any) {
        console.warn(`[ClinicalAI] Gemini ${model} failed:`, err.message);
      }
    }
  }

  // ════════════════════════════════════════════════════
  // TIER 3: Groq Clinical Llama 3.3 70B (if valid key)
  // ════════════════════════════════════════════════════
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.slice(-4).map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 350,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content || '';
      const parsed = extractJSON(raw);
      if (parsed?.audio_response) {
        return {
          success: true,
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          type: parsed.type || 'general',
          severity: parsed.severity || 'low',
          protocol_triggered: parsed.protocol_triggered || 'CLINICAL_EVAL',
          immediate_action: parsed.immediate_action || 'NOTIFY_CARETAKER',
          audio_response: truncateAudioResponse(parsed.audio_response),
          summary: parsed.summary || cleanTranscript.slice(0, 80),
          clinical_triage_notes: parsed.clinical_triage_notes,
        };
      }
    } catch (err: any) {
      console.warn('[ClinicalAI] Groq failed:', err.message);
    }
  }

  // ════════════════════════════════════════════════════
  // TIER 4: Dynamic Geriatric Safety Fallback
  // ════════════════════════════════════════════════════
  return clinicalRuleBasedFallback(cleanTranscript, lang, name);
}

// ─── Rule-Based Geriatric Safety Engine (Zero Hallucination Guaranteed) ───
export function clinicalRuleBasedFallback(
  transcript: string,
  language: string,
  name: string
): ClinicalTriageResult {
  const t = transcript.toLowerCase();
  const lang = language.toLowerCase();
  const isMarathi = lang.startsWith('mr') || lang === 'marathi';
  const isHindi = lang.startsWith('hi') || lang === 'hindi';

  // 1. Cardiac / Acute Chest Pain
  if (t.includes('chest') || t.includes('heart') || t.includes('छाती') || t.includes('हृदय') || t.includes('सीने')) {
    const audio = isMarathi
      ? `${name} काका, शांतपणे सरळ बसा, हालचाल करू नका. आम्ही ताबडतोब १०८ रुग्णवाहिका आणि डॉक्टरांना बोलावले आहे.`
      : isHindi
      ? `${name} जी, शांत होकर सीधे बैठ जाएं, हिले-डुले नहीं। हमने तुरंत १०८ एम्बुलेंस और डॉक्टर को सूचित कर दिया है।`
      : `${name}, please sit upright and stay completely still. We have notified emergency services and the medical team immediately.`;
    return {
      success: true,
      provider: 'clinical-fallback',
      model: 'cardiac-protocol-v1',
      type: 'emergency',
      severity: 'high',
      protocol_triggered: 'CARDIAC_TRIAGE',
      immediate_action: 'DISPATCH_108_NOTIFY_CARETAKER',
      audio_response: audio,
      summary: `Cardiac Alert: ${transcript.slice(0, 60)}`,
    };
  }

  // 2. Falls & Trauma
  if (t.includes('fall') || t.includes('fell') || t.includes('पडलो') || t.includes('पडले') || t.includes('गिर') || t.includes('फ्रॅक्चर')) {
    const audio = isMarathi
      ? `${name}, कृपया स्वतःहून उठण्याचा प्रयत्न करू नका! तिथेच विश्रांती घ्या, आमचे कर्मचारी लगेच आपल्या मदतीसाठी येत आहेत.`
      : isHindi
      ? `${name} जी, कृपया खुद उठने की कोशिश न करें! वहीं आराम करें, हमारे स्टाफ अभी आपकी मदद के लिए आ रहे हैं।`
      : `${name}, please do not attempt to stand up on your own! Stay where you are, our staff is arriving right now.`;
    return {
      success: true,
      provider: 'clinical-fallback',
      model: 'fall-protocol-v1',
      type: 'emergency',
      severity: 'high',
      protocol_triggered: 'FALL_ASSESSMENT',
      immediate_action: 'IMMOBILIZE_DO_NOT_MOVE',
      audio_response: audio,
      summary: `Fall Emergency: ${transcript.slice(0, 60)}`,
    };
  }

  // 3. Stroke / Slurred Speech / Sudden Weakness
  if (t.includes('stroke') || t.includes('paralysis') || t.includes('सुन्न') || t.includes('बोलता येत नाही') || t.includes('लखवा')) {
    const audio = isMarathi
      ? `${name}, शांत राहा, काही बोलण्याचा ताण घेऊ नका. मी तत्काळ डॉक्टरांना आणि कर्मचाऱ्यांना खोलीत पाठवत आहे.`
      : isHindi
      ? `${name} जी, शांत रहें, बोलने का तनाव न लें। मैं तुरंत डॉक्टर और स्टाफ को आपके पास भेज रहा हूँ।`
      : `${name}, stay calm and rest your head. I am dispatching the clinical team to your room immediately.`;
    return {
      success: true,
      provider: 'clinical-fallback',
      model: 'stroke-befast-v1',
      type: 'emergency',
      severity: 'high',
      protocol_triggered: 'STROKE_BEFAST',
      immediate_action: 'DISPATCH_108_NOTIFY_CARETAKER',
      audio_response: audio,
      summary: `Stroke BE-FAST Indicator: ${transcript.slice(0, 60)}`,
    };
  }

  // 4. Diabetic Hypoglycemia (Rule of 15)
  if (t.includes('sugar') || t.includes('साखर') || t.includes('थरथर') || t.includes('चक्कर') || t.includes('घाम') || t.includes('dizzy')) {
    const audio = isMarathi
      ? `${name}, चक्कर येत असल्यास खाली बसा. ग्लुकोज किंवा साखर पाणी जवळ असल्यास प्या, आम्ही तपासणीसाठी कर्मचारी पाठवत आहोत.`
      : isHindi
      ? `${name} जी, चक्कर आ रही हो तो बैठ जाएं। पास में मीठा पानी या ग्लूकोज हो तो लें, हम स्टाफ को भेज रहे हैं।`
      : `${name}, please sit down immediately. If you have glucose water, take a few sips while staff arrives to check your sugar.`;
    return {
      success: true,
      provider: 'clinical-fallback',
      model: 'hypoglycemia-rule15-v1',
      type: 'symptom',
      severity: 'medium',
      protocol_triggered: 'HYPOGLYCEMIA_RULE15',
      immediate_action: 'ALERT_CARETAKER_CHECK_VITALS',
      audio_response: audio,
      summary: `Hypoglycemia / Dizziness Alert: ${transcript.slice(0, 60)}`,
    };
  }

  // 5. Medication Dosage Query Safety
  if (t.includes('dose') || t.includes('dosage') || t.includes('औषध') || t.includes('गोळी') || t.includes('दवा') || t.includes('डोस')) {
    const audio = isMarathi
      ? `${name}, डॉक्टरांच्या सल्ल्याशिवाय गोळ्यांचा डोस बदलू नका. मी डॉ. कुलकर्णी यांना आपल्या औषधांच्या नोंदी तपासण्यास सांगत आहे.`
      : isHindi
      ? `${name} जी, डॉक्टर की सलाह के बिना दवा की खुराक न बदलें। मैं डॉक्टर कुलकर्णी को जानकारी भेज रहा हूँ।`
      : `${name}, please do not alter any medication dosage without medical approval. I am contacting Dr. Kulkarni for guidance.`;
    return {
      success: true,
      provider: 'clinical-fallback',
      model: 'medication-safety-v1',
      type: 'symptom',
      severity: 'medium',
      protocol_triggered: 'MEDICATION_SAFETY',
      immediate_action: 'REFER_TO_FACILITY_PHYSICIAN',
      audio_response: audio,
      summary: `Medication Inquiry: ${transcript.slice(0, 60)}`,
    };
  }

  // 6. "What to do next" / Routine guidance query
  if (t.includes('what to do') || t.includes('next') || t.includes('काय करू') || t.includes('पुढे काय') || t.includes('रूटीन') || t.includes('routine')) {
    const audio = isMarathi
      ? `${name}, आपण आपले औषध किंवा नाश्त्याचे वेळापत्रक पाहू शकतो, किंवा थोडे विश्रांती घेऊन संगीत ऐकू शकता. आपल्याला काय आवडेल?`
      : isHindi
      ? `${name} जी, हम आपका दवा या नाश्ते का रूटीन देख सकते हैं, या आप आराम करके संगीत सुन सकते हैं। आप क्या पसंद करेंगे?`
      : `We can check your daily routine together, ${name}. Would you like to review your medications, have a drink of water, or relax for a bit?`;
    return {
      success: true,
      provider: 'clinical-fallback',
      model: 'routine-guidance-v1',
      type: 'general',
      severity: 'low',
      protocol_triggered: 'GERIATRIC_WELLNESS',
      immediate_action: 'CHECK_DAILY_SCHEDULE',
      audio_response: audio,
      summary: `Routine Guidance: ${transcript.slice(0, 60)}`,
    };
  }

  // 7. Conversational inquiry / repetition complaint
  if (t.includes('same answer') || t.includes('why are you') || t.includes('bot') || t.includes('पुन्हा पुन्हा') || t.includes('वही जवाब')) {
    const audio = isMarathi
      ? `माफ करा ${name}, मी आपले नीट ऐकत आहे. कृपया सांगा आपल्याला नेमकी काय अडचण आहे, मी पूर्ण मदत करतो.`
      : isHindi
      ? `क्षमा करें ${name} जी, मैं ध्यान से सुन रहा हूँ। कृपया बताएं आपको क्या सहायता चाहिए, मैं तुरंत मदद करूँगा।`
      : `I apologize for that, ${name}. I am listening carefully now. Please tell me what you need assistance with, and I will help directly.`;
    return {
      success: true,
      provider: 'clinical-fallback',
      model: 'conversational-repair-v1',
      type: 'general',
      severity: 'low',
      protocol_triggered: 'CONVERSATIONAL_REPAIR',
      immediate_action: 'ATTEND_RESIDENT_NEED',
      audio_response: audio,
      summary: `Conversational Repair: ${transcript.slice(0, 60)}`,
    };
  }

  // 8. General Empathetic Elder Greeting / Companionship
  const audio = isMarathi
    ? `नमस्ते ${name} काका! मी सेवाकेअर सहाय्यक आहे. मी आज आपल्यासाठी काय करू शकेन?`
    : isHindi
    ? `नमस्ते ${name} जी! मैं सेवाकेअर सहायक हूँ। आज मैं आपकी क्या सेवा कर सकता हूँ?`
    : `Hello ${name}! I am right here with you. How can I assist you right now?`;
  return {
    success: true,
    provider: 'clinical-fallback',
    model: 'geriatric-validation-v1',
    type: 'general',
    severity: 'low',
    protocol_triggered: 'GERIATRIC_WELLNESS',
    immediate_action: 'LOG_WELLNESS_INTERACTION',
    audio_response: audio,
    summary: `Wellness Interaction: ${transcript.slice(0, 60)}`,
  };
}
