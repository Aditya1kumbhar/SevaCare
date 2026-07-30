'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, AlertTriangle, Activity, Languages, Bot, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { analyzeTranscript, getLanguageCode } from '@/lib/voice-commands';

interface Resident { id: string; name: string; }
interface Message { id: string; role: 'user' | 'ai'; text: string; type?: string; timestamp: Date; }

export default function VoiceAssistantPage() {
  const [mounted, setMounted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [language, setLanguage] = useState('English');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [selectedResident, setSelectedResident] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const recognitionRef = useRef<any>(null);
  const finalTextRef = useRef('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    fetchResidents();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveText, isProcessing]);

  const fetchResidents = async () => {
    try {
      const { data, error } = await supabase.from('residents').select('id, name');
      if (error || !data || data.length === 0) {
        const fb = [{ id: 'demo-1', name: 'Rajesh Sharma' }, { id: 'demo-2', name: 'Priya Patel' }, { id: 'demo-3', name: 'Amitabh Verma' }];
        setResidents(fb); setSelectedResident(fb[0].id); return;
      }
      setResidents(data as any);
      if (data.length > 0) setSelectedResident(data[0].id);
    } catch {
      const fb = [{ id: 'demo-1', name: 'Rajesh Sharma' }];
      setResidents(fb); setSelectedResident(fb[0].id);
    }
  };

  // ─── Speak AI response out loud (with native API fallback for Marathi/Hindi) ───
  const speak = async (text: string, lang: string) => {
    if (typeof window === 'undefined') return;

    const code = getLanguageCode(lang);
    const short = code.split('-')[0]; // 'mr', 'hi', 'en'

    // Method 1: Browser SpeechSynthesis (Good for English)
    const playBrowserTTS = (txt: string, langCode: string) => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = langCode;
      u.rate = 1.0;
      u.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const sh = langCode.split('-')[0];
      const match = voices.find(v => v.lang.toLowerCase().startsWith(sh)) ||
                    voices.find(v => v.name.toLowerCase().includes(lang.toLowerCase()));
      if (match) u.voice = match;
      window.speechSynthesis.speak(u);
    };

    // Method 2: High-Quality TTS API for Indian Languages (Hindi, Marathi)
    const playApiTTS = async (txt: string, langCode: string) => {
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: txt, lang: langCode })
        });
        
        if (!response.ok) throw new Error('API failed');
        
        const data = await response.json();
        const urls = data.audioUrls || (data.audioChunks ? data.audioChunks.map((c: string) => `data:audio/mp3;base64,${c}`) : []);

        if (urls && urls.length > 0) {
          let i = 0;
          const playNextChunk = () => {
            if (i >= urls.length) return;
            const audio = new Audio(urls[i]);
            audio.volume = 1.0;
            audio.onended = () => { i++; playNextChunk(); };
            audio.onerror = () => { i++; playNextChunk(); };
            audio.play().catch(e => {
              console.log('Audio playback blocked by browser, falling back', e);
              playBrowserTTS(txt, code);
            });
          };
          playNextChunk();
        } else {
          playBrowserTTS(txt, code);
        }
      } catch (e) {
        console.log('TTS API Error, falling back to browser TTS', e);
        playBrowserTTS(txt, code);
      }
    };

    // Execution Logic
    if (short === 'mr' || short === 'hi') {
      window.speechSynthesis?.cancel(); // stop any ongoing browser speech
      await playApiTTS(text, short);
    } else {
      playBrowserTTS(text, code);
    }
  };

  // ─── Start mic (Google Assistant style: one press, auto-stops after speech) ───
  const startMic = () => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error('Speech recognition not supported in this browser.'); return; }

    // Stop any previous instance
    try { recognitionRef.current?.abort(); } catch {}

    const rec = new SR();
    rec.continuous = false;       // Auto-stops after user finishes speaking
    rec.interimResults = true;    // Show live text as user speaks
    rec.maxAlternatives = 1;
    rec.lang = getLanguageCode(language);
    recognitionRef.current = rec;
    finalTextRef.current = '';

    rec.onstart = () => {
      setIsListening(true);
      setLiveText('');
    };

    rec.onresult = (e: any) => {
      let interim = '';
      let final_ = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final_ += t;
        else interim += t;
      }
      setLiveText(final_ || interim);
      if (final_) finalTextRef.current = final_;
    };

    rec.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === 'not-allowed') {
        toast.error('Microphone blocked. Go to browser settings and allow microphone access for this site.');
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        toast.error('Mic error: ' + e.error);
      }
    };

    rec.onend = () => {
      setIsListening(false);
      const captured = finalTextRef.current.trim();
      if (captured.length > 0) {
        sendToAI(captured, language);
      }
    };

    try { rec.start(); } catch {}
  };

  const stopMic = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  };

  // ─── Send to Gemini AI and get response ───
  const sendToAI = async (text: string, lang: string) => {
    setIsProcessing(true);
    setLiveText('');

    // Add user bubble
    setMessages(prev => [...prev, { id: 'u' + Date.now(), role: 'user', text, timestamp: new Date() }]);

    let reply = '';
    let type = 'general';

    let spokenText = '';
    try {
      const resObj = residents.find(r => r.id === selectedResident);
      const res = await fetch('/api/ai-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, language: lang, residentName: resObj?.name || 'Resident' })
      });
      const data = await res.json();
      if (data?.audio_response) {
        spokenText = data.audio_response;
        reply = data.audio_response;
        if (data.detailed_analysis && data.detailed_analysis.trim()) {
          reply += `\n\n📋 Clinical Guidance:\n${data.detailed_analysis}`;
        }
        type = data.type || 'general';
      }
    } catch {}

    // Fallback if no reply
    if (!reply) {
      const a = analyzeTranscript(text, lang);
      type = a.type;
      reply = lang === 'Hindi'
        ? (type === 'emergency' ? 'कृपया तुरंत बैठ जाएं, शांत रहें! मैंने आपातकालीन टीम को सूचित कर दिया है।' : type === 'symptom' ? 'कृपया आराम करें, मैंने आपका लक्षण दर्ज कर लिया है।' : 'आपकी बात नोट कर ली गई है।')
        : lang === 'Marathi'
        ? (type === 'emergency' ? 'कृपया ताबडतोब खाली बसा! मी आपत्कालीन पथकाला कळवले आहे.' : type === 'symptom' ? 'कृपया विश्रांती घ्या, मी नोंद घेतली आहे.' : 'तुमची नोंद घेतली आहे.')
        : (type === 'emergency' ? 'Please sit down immediately and stay calm! I have alerted the emergency team.' : type === 'symptom' ? 'Please rest, I have recorded your symptom for the doctor.' : 'Your message has been logged. A caretaker will assist you.');
      spokenText = reply;
    }

    // Add AI bubble
    setMessages(prev => [...prev, { id: 'a' + Date.now(), role: 'ai', text: reply, type, timestamp: new Date() }]);

    // Speak ONLY the audio_response out loud!
    speak(spokenText || reply, lang);

    // Save to DB
    if (type === 'emergency') {
      try { await supabase.from('emergency_alerts').insert({ resident_id: selectedResident, alert_type: 'medical', severity: 'high', description: `[AI Voice] ${text}` }); } catch {}
      toast.error('🚨 Emergency alert created!', { duration: 5000 });
    } else if (type === 'symptom') {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('daily_logs').insert({ resident_id: selectedResident, caretaker_id: user?.id, status: 'fair', notes: `[AI Voice] ${text}` });
      } catch {}
      toast.success('📋 Symptom recorded');
    }

    setIsProcessing(false);
  };

  const handleQuickTest = (text: string, lang: string) => {
    if (!selectedResident && residents.length > 0) setSelectedResident(residents[0].id);
    setLanguage(lang);
    try { recognitionRef.current?.abort(); } catch {}
    setIsListening(false);
    sendToAI(text, lang);
  };

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="w-7 h-7 text-blue-600" /> AI Voice Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Press the mic, speak, and get an instant AI response.</p>
        </div>
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <select className="bg-background border rounded-lg px-3 py-2 text-sm font-medium" value={language} onChange={e => setLanguage(e.target.value)}>
            <option value="English">English</option>
            <option value="Hindi">हिंदी (Hindi)</option>
            <option value="Marathi">मराठी (Marathi)</option>
          </select>
        </div>
      </div>

      {/* Resident */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium whitespace-nowrap">Resident:</label>
        <select className="flex-1 p-2.5 rounded-lg border bg-background text-sm" value={selectedResident} onChange={e => setSelectedResident(e.target.value)}>
          <option value="" disabled>Select a Resident...</option>
          {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {/* Chat */}
      <Card className="border-2 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/30 py-3 px-4">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2"><Volume2 className="w-4 h-4" /> Conversation</span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${isListening ? 'bg-red-100 text-red-700 animate-pulse' : isProcessing ? 'bg-blue-100 text-blue-700 animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
              {isListening ? '🎙️ Listening...' : isProcessing ? '🤖 Thinking...' : '⏸ Ready'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[350px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !liveText && !isProcessing && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3">
                <Bot className="w-14 h-14 opacity-20" />
                <p className="text-sm font-medium">Press the microphone and speak.</p>
                <p className="text-xs">Or click a quick test button below.</p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.type === 'emergency' ? 'bg-red-100' : msg.type === 'symptom' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                    {msg.type === 'emergency' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : msg.type === 'symptom' ? <Activity className="w-4 h-4 text-amber-600" /> : <Bot className="w-4 h-4 text-blue-600" />}
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' :
                  msg.type === 'emergency' ? 'bg-red-50 border border-red-200 text-red-900 rounded-bl-sm' :
                  msg.type === 'symptom' ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-sm' :
                  'bg-muted border rounded-bl-sm'
                }`}>
                  {msg.text}
                  {msg.role === 'ai' && (
                    <button onClick={() => speak(msg.text, language)} className="mt-1.5 text-xs opacity-50 hover:opacity-100 flex items-center gap-1">
                      <Volume2 className="w-3 h-3" /> Replay
                    </button>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {liveText && (
              <div className="flex gap-2.5 justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm bg-blue-400 text-white italic animate-pulse">{liveText}</div>
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0 animate-pulse mt-0.5">
                  <Mic className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {isProcessing && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-bl-sm px-5 py-3 bg-muted border">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-foreground/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Mic Button */}
          <div className="border-t p-5 flex items-center justify-center gap-5 bg-muted/20">
            <Button
              onClick={isListening ? stopMic : startMic}
              disabled={isProcessing}
              className={`rounded-full w-20 h-20 shadow-xl transition-all duration-200 ${
                isListening ? 'bg-red-600 hover:bg-red-700 ring-[6px] ring-red-200 scale-110' :
                isProcessing ? 'bg-gray-400 cursor-not-allowed' :
                'bg-blue-600 hover:bg-blue-700 hover:scale-105'
              }`}
            >
              {isListening ? <Mic className="w-9 h-9 text-white" /> : <MicOff className="w-9 h-9 text-white" />}
            </Button>
            <div className="text-center min-w-[140px]">
              <p className="text-sm font-semibold">
                {isListening ? '🎙️ Speak now...' : isProcessing ? '🤖 Getting response...' : 'Tap mic to speak'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isListening ? 'I\'ll auto-stop when you pause' : isProcessing ? 'AI is thinking' : 'Press → Speak → Release'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Test */}
      <Card>
        <CardContent className="py-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center mb-3">⚡ Quick Demo Tests</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" size="sm" className="text-xs border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-semibold" onClick={() => handleQuickTest("मदद करो, वह गिर गए हैं और दर्द में हैं!", "Hindi")}>🚨 Hindi Emergency</Button>
            <Button variant="outline" size="sm" className="text-xs border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 font-semibold" onClick={() => handleQuickTest("मुझे बहुत तेज़ बुखार और सिरदर्द है।", "Hindi")}>🩺 Hindi Symptom</Button>
            <Button variant="outline" size="sm" className="text-xs border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold" onClick={() => handleQuickTest("मला खूप चक्कर येत आहे आणि वेदना होत आहेत.", "Marathi")}>🩺 Marathi Symptom</Button>
            <Button variant="outline" size="sm" className="text-xs border-red-200 text-red-700 bg-red-50 hover:bg-red-100 font-semibold" onClick={() => handleQuickTest("Emergency! Severe chest pain and difficulty breathing.", "English")}>🚨 English Emergency</Button>
            <Button variant="outline" size="sm" className="text-xs border-green-200 text-green-700 bg-green-50 hover:bg-green-100 font-semibold" onClick={() => handleQuickTest("I have a mild headache and feeling dizzy since morning.", "English")}>🩺 English Symptom</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
