---
title: SevaCare Indic Parler TTS
emoji: 🎙️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 8000
pinned: false
---

# SevaCare AI4Bharat Indic-Parler-TTS Server

Dedicated geriatric medical text-to-speech microservice for SevaCare.
- **Model:** `ai4bharat/indic-parler-tts`
- **Supported Languages:** Marathi (मराठी), Hindi (हिंदी), and 20+ Indic languages.

## Deployment to Hugging Face Spaces:
1. Create a new Space on [huggingface.co/new-space](https://huggingface.co/new-space)
2. Select **Docker** as SDK (Choose Free CPU or ZeroGPU / T4 GPU)
3. Push the files in `app/services/` (`Dockerfile`, `requirements.txt`, `indic_parler_tts_server.py`, `README.md`)
4. Copy your Space URL (e.g., `https://<user>-sevacare-indic-parler-tts.hf.space`) and set it in your frontend `.env.local`:
   ```env
   INDIC_PARLER_TTS_URL="https://<user>-sevacare-indic-parler-tts.hf.space/synthesize"
   ```
