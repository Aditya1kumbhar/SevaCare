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
import torch
import soundfile as sf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer

app = FastAPI(title="SevaCare AI4Bharat Indic-Parler-TTS Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_ID = "ai4bharat/indic-parler-tts"
device = "cuda:0" if torch.cuda.is_available() else "cpu"

print(f"[*] Initializing Indic-Parler-TTS on device: {device}...")
model = None
tokenizer = None
description_tokenizer = None

def load_tts_model():
    global model, tokenizer, description_tokenizer
    try:
        from parler_tts import ParlerTTSForConditionalGeneration
        print(f"[*] Loading model {MODEL_ID}...")
        model = ParlerTTSForConditionalGeneration.from_pretrained(MODEL_ID).to(device)
        tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
        description_tokenizer = AutoTokenizer.from_pretrained(model.config.text_encoder._name_or_path)
        print("[+] Indic-Parler-TTS model loaded successfully!")
    except Exception as e:
        print(f"[-] Error loading Indic-Parler-TTS: {e}")
        print("[!] Make sure to install: pip install git+https://github.com/huggingface/parler-tts.git")

@app.on_event("startup")
def startup_event():
    load_tts_model()

class TTSRequest(BaseModel):
    text: str
    language: str = "mr"
    description: str = "A female speaker with a clear, calm, moderate-paced voice and natural Marathi pronunciation."

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
    global model, tokenizer, description_tokenizer
    if model is None:
        load_tts_model()
        if model is None:
            raise HTTPException(status_code=503, detail="Indic-Parler-TTS model is not loaded.")

    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")

    # Tailor description for specific Indian language if not customized
    desc = req.description
    if req.language == "mr" and "Marathi" not in desc:
        desc = "A compassionate female speaker with a clear, calm, moderate-paced voice and natural Marathi accent."
    elif req.language == "hi" and "Hindi" not in desc:
        desc = "A compassionate female speaker with a clear, calm, moderate-paced voice and natural Hindi accent."

    try:
        with torch.no_grad():
            prompt_input_ids = tokenizer(req.text, return_tensors="pt").input_ids.to(device)
            input_ids = description_tokenizer(desc, return_tensors="pt").input_ids.to(device)

            generation = model.generate(input_ids=input_ids, prompt_input_ids=prompt_input_ids)
            audio_arr = generation.cpu().numpy().squeeze()

            # Encode into in-memory WAV buffer
            wav_buffer = io.BytesIO()
            sf.write(wav_buffer, audio_arr, model.config.sampling_rate, format='WAV')
            wav_buffer.seek(0)
            base64_wav = base64.b64encode(wav_buffer.read()).decode('utf-8')
            data_uri = f"data:audio/wav;base64,{base64_wav}"

            return {
                "success": True,
                "provider": "indic-parler-tts",
                "audioUrl": data_uri,
                "sampling_rate": model.config.sampling_rate
            }
    except Exception as e:
        print(f"Synthesis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[*] Starting Indic-Parler-TTS Server on http://localhost:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
