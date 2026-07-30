import { NextResponse } from 'next/server';
import * as googleTTS from 'google-tts-api';
import Groq from 'groq-sdk';

// Helper function to attach 44-byte RIFF WAV header to 24kHz 16-bit Mono PCM buffer
function pcmToWavBase64(pcmBase64: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * numChannels * (bitsPerSample / 8), 28);
  header.writeUInt16LE(numChannels * (bitsPerSample / 8), 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]).toString('base64');
}

export async function POST(request: Request) {
  try {
    const { text, lang } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const languageCode = lang || 'mr';

    // Clean text: strip markdown formatting, emojis, extra spaces
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      .replace(/[*_#`~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const shortText = cleanText.length > 220 ? cleanText.substring(0, 220) + '...' : cleanText;

    // ════════════════════════════════════════════════════
    // LAYER 1: Google Gemini 2.5 Flash Native Multimodal Audio Voice Engine (Studio Quality)
    // ════════════════════════════════════════════════════
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const langName = languageCode === 'mr' ? 'Marathi (Devanagari script)' : languageCode === 'hi' ? 'Hindi (Devanagari script)' : 'English';
        const promptText = `Speak out loud in clear, natural, fluent ${langName}: "${shortText}"`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Aoede" // Studio prebuilt voices: "Aoede", "Kore", "Puck", "Charon", "Fenrir"
                  }
                }
              }
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const pcmBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (pcmBase64) {
            const wavBase64 = pcmToWavBase64(pcmBase64);
            const dataUri = `data:audio/wav;base64,${wavBase64}`;
            console.log('[TTS] Gemini 2.5 Flash Native Audio OK');
            return NextResponse.json({
              success: true,
              provider: 'gemini-native-audio',
              audioUrl: dataUri
            });
          }
        }
      } catch (e: any) {
        console.log('[TTS] Gemini Native Audio failed, trying next layer:', e.message);
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 2: Groq Audio Speech SDK (canopylabs/orpheus-v1-english)
    // ════════════════════════════════════════════════════
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const audioResponse = await groq.audio.speech.create({
          model: 'canopylabs/orpheus-v1-english',
          voice: 'troy',
          input: shortText,
          response_format: 'wav'
        });
        const arrayBuffer = await audioResponse.arrayBuffer();
        const base64Wav = Buffer.from(arrayBuffer).toString('base64');
        const dataUri = `data:audio/wav;base64,${base64Wav}`;
        console.log('[TTS] Groq Orpheus Speech API OK');
        return NextResponse.json({
          success: true,
          provider: 'groq-orpheus-speech',
          audioUrl: dataUri
        });
      } catch (e: any) {
        console.log('[TTS] Groq Orpheus Speech failed, trying Google TTS fallback:', e.message);
      }
    }

    // ════════════════════════════════════════════════════
    // LAYER 3: Google TTS Base64 Fallback
    // ════════════════════════════════════════════════════
    const base64Audio = await googleTTS.getAudioBase64(shortText, {
      lang: languageCode,
      slow: false,
      host: 'https://translate.google.com',
      timeout: 10000,
    });

    const dataUri = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      provider: 'google-tts-fallback',
      audioUrl: dataUri
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return NextResponse.json({ error: 'Failed to generate speech', details: error.message }, { status: 500 });
  }
}
