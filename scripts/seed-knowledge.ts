/**
 * Seed script: chunks knowledge-base.ts data and inserts into Supabase knowledge_chunks
 * with Gemini embeddings for RAG retrieval.
 *
 * Run: npx tsx scripts/seed-knowledge.ts
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GEMINI_API_KEY in .env.local
 */

import 'dotenv/config';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

async function embedText(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    }
  );
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`);
  const data = await res.json();
  return data.embedding?.values || [];
}

async function insertChunk(content: string, metadata: Record<string, string>) {
  console.log(`  Embedding: "${content.substring(0, 60)}..."`);
  const embedding = await embedText(content);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ content, metadata, embedding }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Insert failed: ${res.status} ${err}`);
  }
}

// ─── Knowledge chunks to seed ───
const CHUNKS = [
  {
    content: "डॉक्टर कुलकर्णी (Dr. Kulkarni) हे फॅसिलिटीचे जनरल फिजिशियन आहेत. ते दर मंगळवारी दुपारी ४ वाजता भेट देतात. कर्मचाऱ्यांनी ३:३० वाजता व्हायटल्स लॉग आणि हेल्थ चार्ट तयार ठेवणे आवश्यक आहे. Dr. Kulkarni is the facility's attending General Physician. Visits every Tuesday at 4:00 PM. Staff must prepare vitals log and health chart review by 3:30 PM.",
    metadata: { category: 'facility_sop', topic: 'doctor_schedule' },
  },
  {
    content: "भारतीय आपत्कालीन क्रमांक: 108 (अॅम्ब्युलन्स), 112 (पोलीस). फॅसिलिटी फिजिशियन: डॉ. कुलकर्णी. Indian emergency numbers: 108 (national ambulance), 112 (police). Facility physician: Dr. Kulkarni.",
    metadata: { category: 'emergency', topic: 'contacts' },
  },
  {
    content: "हायपोग्लायसेमिया (Low Blood Sugar < 70 mg/dL): शुद्धीवर असल्यास — Rule of 15 लागू करा: 15g जलद साखर (3-4 चमचे साखर पाण्यात किंवा 150ml फळाचा रस) द्या. 15 मिनिटे थांबा, पुन्हा रक्तातील साखर तपासा. बेशुद्ध किंवा गोंधळलेल्या रुग्णाला तोंडावाटे द्रव देणे धोकादायक (गुदमरण्याचा धोका). तात्काळ कुशीवर ठेवा आणि 108 ला कॉल करा.",
    metadata: { category: 'first_aid', topic: 'hypoglycemia' },
  },
  {
    content: "छातीत दुखणे / हृदयविकाराचा संशय (Chest Pain / Cardiac Event): रुग्णाला तात्काळ सरळ बसवा. गळ्याभोवतीचे आणि छातीवरचे घट्ट कपडे सैल करा. 108 ला तात्काळ कॉल करा. कार्डिओलॉजिस्टने पूर्व-मंजूर केल्याशिवाय Aspirin किंवा Sorbitrate देऊ नका.",
    metadata: { category: 'first_aid', topic: 'chest_pain' },
  },
  {
    content: "उच्च रक्तदाब (BP Spike > 180/120 mmHg): रुग्णाला शांत, थंड, अंधुक प्रकाशाच्या खोलीत हलवा. 15 मिनिटे शांतपणे विश्रांती घेऊ द्या, नंतर पुन्हा BP तपासा. SOS औषधांसाठी डॉ. कुलकर्णींशी संपर्क साधा. चक्कर, तीव्र डोकेदुखी, किंवा अंधुक दृष्टी यावर लक्ष ठेवा.",
    metadata: { category: 'first_aid', topic: 'bp_spike' },
  },
  {
    content: "उष्माघात (Heat Stroke): रुग्णाला तात्काळ AC किंवा पंख्याच्या थंड खोलीत हलवा. मान, कपाळ, आणि काखेत ओले थंड टॉवेल लावा. पूर्ण शुद्धीवर असल्यास ORS किंवा खारट ताकाचे लहान घोट द्या. बर्फाच्या पाण्यात बुडवू नका; हळूहळू थंड करा.",
    metadata: { category: 'first_aid', topic: 'heat_stroke' },
  },
  {
    content: "रहिवासी राजेश कुमार, खोली 204. जुने आजार: Type 2 Diabetes, High BP, Osteoarthritis. ॲलर्जी: Penicillin, Sulfa Drugs. दैनिक औषधे: Metformin 500mg, Telmisartan 40mg. आपत्कालीन नोंद: अचानक साखर कमी होण्याचा (hypoglycemia) उच्च धोका. Resident Rajesh Kumar, Room 204. Chronic: Type 2 Diabetes, High BP, Osteoarthritis. Allergies: Penicillin, Sulfa Drugs. Daily meds: Metformin 500mg, Telmisartan 40mg. Emergency note: High risk for sudden hypoglycemia.",
    metadata: { category: 'resident_profile', topic: 'rajesh_kumar' },
  },
  {
    content: "पडणे / फ्रॅक्चर (Fall / Fracture): रुग्णाला हलवू नका. शांत राहण्यास सांगा. दुखापत, सूज किंवा विकृती तपासा. मान किंवा पाठीच्या दुखापतीचा संशय असल्यास 108 ला कॉल करा. रक्तस्त्राव होत असल्यास स्वच्छ कपड्याने दाबा. Fall / Fracture: Do not move the resident. Keep them calm. Check for pain, swelling, deformity. If neck/spine injury suspected, call 108. Apply pressure with clean cloth if bleeding.",
    metadata: { category: 'first_aid', topic: 'fall_fracture' },
  },
  {
    content: "सामान्य संवाद (General Conversation): रहिवाशांशी मराठीत आदरपूर्ण, प्रेमळ भाषेत बोला. त्यांचे नाव वापरा. वैद्यकीय सल्ला विचारल्यास नेहमी डॉक्टरांचा संदर्भ द्या. अनावश्यक लांबलचक उत्तरे देऊ नका. For general conversation: speak respectfully and warmly in Marathi. Use their name. Always refer to doctor for medical advice. Keep responses brief.",
    metadata: { category: 'general', topic: 'conversation_guidelines' },
  },
];

async function main() {
  console.log('🌱 Seeding knowledge chunks...\n');

  for (let i = 0; i < CHUNKS.length; i++) {
    const chunk = CHUNKS[i];
    console.log(`[${i + 1}/${CHUNKS.length}] Category: ${chunk.metadata.category} / ${chunk.metadata.topic}`);
    await insertChunk(chunk.content, chunk.metadata);
    // Rate limit: Gemini free tier is 15 RPM for embeddings
    if (i < CHUNKS.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n✅ Done! All knowledge chunks seeded.');
}

main().catch(e => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
