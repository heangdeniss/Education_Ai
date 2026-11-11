# 🎓 Khmer Grade 12 Education Chatbot

RAG chatbot for Cambodian Grade 12 students (History, Morality-Civics, Tum Teav).

```
frontend/  React + Vite chat UI  ──@gradio/client──►  space/app.py on Hugging Face (ZeroGPU)
                                                         ├─ multilingual-e5-base  (query embedding)
                                                         ├─ RAG/chroma_db          (khmer_corpus, 411 chunks)
                                                         └─ Qwen2.5-1.5B-Instruct  (streamed answer)
```

## 1. Deploy the Space

```powershell
pip install huggingface_hub
hf auth login                                  # once
python space/deploy.py <username>/<space-name> # uploads app.py, requirements.txt, README.md + chroma_db
```

In the Space **Settings → Hardware**, choose **ZeroGPU** (or any GPU). On CPU it still runs, but slowly.

## 2. Run the frontend

```powershell
cd frontend
copy .env.example .env      # then set VITE_HF_SPACE=<username>/<space-name>
npm install
npm run dev                 # http://localhost:5173
npm run build               # static files in frontend/dist (Vercel, Netlify, GitHub Pages…)
```

## Run the backend locally (optional)

```powershell
pip install gradio chromadb sentence-transformers transformers accelerate torch
python space/app.py                 # http://127.0.0.1:7860, reads ../RAG/chroma_db automatically
# then in frontend/.env: VITE_HF_SPACE=http://127.0.0.1:7860
```

Env overrides for `space/app.py`: `MODEL_ID`, `TOP_K` (default 3), `MAX_NEW_TOKENS` (768), `CHROMA_DIR`.
