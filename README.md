<div align="center">
  <img src="frontend/public/logo.png" alt="SevaCare Logo" width="120" />
  <h1>🌟 SevaCare 🌟</h1>
  <p><b>Smart India Hackathon (SIH) Winning Solution</b></p>
  <p><i>The Most Advanced, Yet Easiest-to-Use Elder Care Management System Designed for India's Vridhashrams (Old Age Homes)</i></p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/Supabase-Green?style=for-the-badge&logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/Groq-Llama_3-blue?style=for-the-badge&logo=meta" alt="AI Voice" />
    <img src="https://img.shields.io/badge/PWA-Offline_Ready-purple?style=for-the-badge&logo=pwa" alt="PWA" />
  </p>
</div>

<br />

## 🏆 Why SevaCare? (SIH Perspective)
Old-age homes in India face critical challenges: staff shortages, poor record-keeping, medical emergencies, and lack of tech literacy among the elderly. **SevaCare** solves this with a **zero-learning-curve** ecosystem. 

Whether it's a rural care home with no internet or an elderly resident speaking only Marathi or Hindi, SevaCare adapts instantly. It is built to impress judges, empower caretakers, and save lives.

---

## 🚀 Game-Changing Features

### 🎙️ 1. Multilingual AI Voice Assistant (Regional Languages)
- **Zero Tech Literacy Required:** Elderly residents simply push a large button and speak in **Hindi, Marathi, or English**.
- **Blazing Fast AI:** Powered by **Groq Llama 3.3 70B** (0.1s latency) with Gemini fallback and offline keyword support.
- **Smart Triage:** Automatically detects if the statement is an *Emergency*, *Symptom*, or *General Query*, and triggers appropriate alarms (e.g., auto-calling staff for "chest pain").
- **Native TTS:** Responds back in natural, Devanagari script text-to-speech.

### 📶 2. Offline-First PWA (Rural India Ready)
- Built for areas with poor or no internet connectivity.
- Uses **Dexie.js (IndexedDB)** to store health logs locally.
- Automatically syncs with the cloud (Supabase) the moment the connection is restored.

### 📹 3. Low-Bandwidth Telemedicine
- **1-Click Video Calls:** Caretakers generate a 6-digit room code, and doctors can join via WebRTC instantly from their browser.
- **Low Bandwidth Mode:** Optimizes video to 100kbps (320x240) so video calls stay smooth even on poor 3G networks.

### 🚨 4. Real-Time Emergency Escalation
- If a resident has a critical emergency, SevaCare broadcasts real-time alarms across the facility using **Supabase Realtime**.
- Automated WhatsApp/SMS escalation if caretakers do not acknowledge the alert within 60 seconds.

### 🔐 5. AES-256 Encrypted Health Records
- Complete patient data privacy. Health records are encrypted client-side before being stored in the cloud.

---

## 🛠️ Tech Stack
- **Frontend Framework:** Next.js 16 (App Router), React 19, Tailwind CSS
- **Database & Backend:** Supabase (PostgreSQL, Realtime, Auth, RLS)
- **AI Infrastructure:** Groq (Llama 3.3 70B), Google Gemini 2.0 Flash
- **Offline Storage:** Dexie.js (IndexedDB)
- **PWA Capabilities:** `@ducanh2912/next-pwa`
- **Video Calling:** Native WebRTC over Supabase Broadcast Channels

---

## 🏃‍♂️ Getting Started (Running Locally)

It is incredibly easy to run SevaCare on your machine.

### 1. Clone the Repository
```bash
git clone https://github.com/Aditya1kumbhar/SevaCare.git
cd SevaCare/frontend
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the `frontend` directory and add your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The app is fully responsive and works on desktop, tablets, and mobiles!

---

## 🎯 The Impact
SevaCare isn't just software; it's a lifeline. By drastically reducing caretaker burden and ensuring no medical emergency goes unnoticed, we are bringing dignity, safety, and modern healthcare to the elderly who need it most.

Made with ❤️ for Smart India Hackathon.
