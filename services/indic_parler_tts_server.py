"""
AI4Bharat Indic-Parler-TTS Dedicated Microservice for SevaCare
Model: ai4bharat/indic-parler-tts
Supports: Marathi (मराठी), Hindi (हिंदी), and 20+ Indic languages.

Run with:
  pip install -r requirements.txt
  python indic_parler_tts_server.py
"""

import io
import os
import base64
import asyncio
from contextlib import asynccontextmanager
from typing import Optional

import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoTokenizer

MODEL_ID = os.environ.get("INDIC_TTS_MODEL_ID", "ai4bharat/indic-parler-tts")
device = "cuda:0" if torch.cuda.is_available() else "cpu"

model = None
tokenizer = None
description_tokenizer = None

def load_tts_model():
    global model, tokenizer, description_tokenizer
    try:
        from parler_tts import ParlerTTSForConditionalGeneration
        print(f"[*] Loading model {MODEL_ID} on device {device}...")
        model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID).to(device)
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
        print("[+] Indic-Parler-TTS model loaded successfully!")
    except Exception as e:
        print(f"[-] Warning: Error loading Indic-Parler-TTS: {e}")
        print("[!] Install dependencies: pip install git+https://github.com/huggingface/parler-tts.git soundfile")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load ML weights once during lifespan startup
    await asyncio.to_thread(load_tts_model)
    yield
    # Clean shutdown

app = FastAPI(title="SevaCare AI4Bharat Indic-Parler-TTS Server", lifespan=lifespan)

# Restrict CORS to configured origins
raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500, description="Text to synthesize")
    language: str = Field(default="mr", max_length=10, description="ISO language code (mr, hi, en)")
    description: Optional[str] = Field(
        default="A compassionate female speaker with a clear, calm, moderate-paced voice and natural Marathi accent.",
        max_length=300
    )

def _generate_audio_sync(text: str, desc: str):
    """Synchronous inference runner to be executed off the main event loop."""
    with torch.no_grad():
        prompt_input_ids = tokenizer(text, return_tensors="pt").input_ids.to(device)
        input_ids = description_tokenizer(desc, return_tensors="pt").input_ids.to(device)

        generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_input_ids)
        audio_arr = generation.cpu().numpy().squeeze()

        wav_buffer = io.BytesIO()
        sf.write(wav_buffer, audio_arr, model.config.sampling_rate, format='WAV')
        wav_buffer.seek(0)
        base64_wav = base64.b64encode(wav_buffer.read()).decode('utf-8')
        return base64_wav, model.config.sampling_rate

@app.get("/health")
def health_check():
    return {
        "status": "healthy" if model is not None else "model_not_loaded",
        "model": MODEL_ID,
        "device": device,
        "cuda_available": torch.cuda.is_available()
    }

@app.post("/synthesize")
async def synthesize_speech(req: TTSRequest):
    if model is None or tokenizer is None or description_tokenizer is None:
        raise HTTPException(
            status_code=503, 
            detail="Indic-Parler-TTS model is not loaded. Ensure PyTorch and parler-tts dependencies are installed."
        )

    clean_text = req.text.strip()
    if not clean_text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    desc = req.description or ""
    if req.language == "mr" and "Marathi" not in desc:
        desc = "A compassionate female speaker with a clear, calm, moderate-paced voice and natural Marathi accent."
    elif req.language == "hi" and "Hindi" not in desc:
        desc = "A compassionate female speaker with a clear, calm, moderate-paced voice and natural Hindi accent."

    try:
        # Offload synchronous model inference to thread to avoid blocking the event loop
        base64_wav, sampling_rate = await asyncio.to_thread(_generate_audio_sync, clean_text, desc)
        data_uri = f"data:audio/wav;base64,{base64_wav}"

        return {
            "success": True,
            "provider": "indic-parler-tts",
            "audioUrl": data_uri,
            "sampling_rate": sampling_rate
        }
    except Exception as e:
        print(f"[-] Synthesis error: {e}")
        raise HTTPException(status_code=500, detail="Speech synthesis failed internally.")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[*] Starting Indic-Parler-TTS Server on http://localhost:{port}")
    uvicorn.run("indic_parler_tts_server:app", host="0.0.0.0", port=port, reload=False)
