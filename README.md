# 🎓 Khmer Grade 12 Education Chatbot

RAG chatbot for Cambodian Grade 12 students — History, Morality-Civics and Tum Teav.
A React chat UI on **GitHub Pages** talks to a Gradio API on **Hugging Face Spaces**,
which retrieves from a local Chroma index and streams answers from Qwen2.5-1.5B.

```
GitHub Pages                 Hugging Face Space (ZeroGPU)
frontend/  ── @gradio/client ──►  space/app.py
   React + Vite                     ├─ intfloat/multilingual-e5-base  (query embedding)
   static build                     ├─ RAG/chroma_db                  (khmer_corpus, 411 chunks)
                                    └─ Qwen/Qwen2.5-1.5B-Instruct     (streamed answer)
```

## Repository layout

```
.
├─ frontend/                  React + Vite chat UI (the part hosted on GitHub Pages)
│  ├─ src/
│  │  ├─ components/          Sidebar, Message, Composer, Sources, Welcome, Icons
│  │  ├─ api.js               Gradio client + streaming protocol
│  │  ├─ storage.js           Conversation persistence (localStorage)
│  │  ├─ data.js              Static UI data (subjects, suggestions)
│  │  ├─ App.jsx, main.jsx    App shell
│  │  └─ index.css            Global styles
│  ├─ vite.config.js          Pages-aware `base` path
│  ├─ .env.example            Copy to `.env` for local development
│  └─ package.json
├─ space/                     Hugging Face Space backend
│  ├─ app.py                  RAG pipeline, `/chat` streaming API, Gradio UI
│  ├─ deploy.py               Uploads app files + Chroma DB to the Hub
│  ├─ requirements.txt
│  └─ README.md               Space card (YAML front matter)
├─ RAG/                       Knowledge base
│  ├─ Document_Loader.ipynb   Rebuilds the vector store
│  ├─ Text_Document/          Khmer source text
│  └─ chroma_db/              Committed Chroma index (~13 MB)
├─ .github/workflows/         CI and GitHub Pages deployment
├─ .gitattributes
└─ LICENSE                    MIT
```

## 1. Deploy the backend Space

```powershell
pip install huggingface_hub
hf auth login                                  # once
python space/deploy.py <username>/<space-name> # uploads app.py, requirements.txt, README.md + chroma_db
```

In the Space **Settings → Hardware**, choose **ZeroGPU** (or any GPU). On CPU it still runs, but slowly.

## 2. Run the frontend locally

```powershell
cd frontend
copy .env.example .env      # then set VITE_HF_SPACE=<username>/<space-name>
npm install
npm run dev                 # http://localhost:5173
npm run build               # static files in frontend/dist
```

To point at a local backend instead, run `python space/app.py` and set
`VITE_HF_SPACE=http://127.0.0.1:7860`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_HF_SPACE` | `frontend/.env`, Pages variable | Space id (`user/name`) or full URL |
| `VITE_HF_TOKEN` | `frontend/.env`, Pages secret | Optional; only for private Spaces |
| `VITE_BASE` | build time | Override the Pages base path (custom domains) |
| `MODEL_ID`, `EMBED_MODEL_ID`, `TOP_K`, `MAX_NEW_TOKENS`, `CHROMA_DIR`, `CHROMA_COLLECTION` | Space env | Backend overrides |

> `VITE_*` values are bundled into the public JS. Never put a write-scoped token there,
> and do not set `VITE_HF_TOKEN` for a public deployment.

## 3. Host the frontend on GitHub Pages

One-time setup:

1. Push the repo to GitHub on the `main` branch (see below).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Settings → Secrets and variables → Actions → Variables → New repository variable**
   named `VITE_HF_SPACE` with value `<username>/<space-name>`.
   (A secret with the same name also works, but the value is not sensitive.)
4. **Settings → Actions → General → Workflow permissions**: allow read/write is *not*
   required; the workflow uses the Pages OIDC token.

Every push to `main` then runs `.github/workflows/deploy-pages.yml`: it installs with
`npm ci`, builds with `GITHUB_REPOSITORY`-derived `base`, adds `.nojekyll` and a
`404.html` fallback, and publishes `frontend/dist` to
`https://<username>.github.io/<repo>/`.

`vite.config.js` sets `base` to `/<repo>/` automatically under GitHub Actions, and to `/`
for `<user>.github.io` repositories. Set `VITE_BASE` to override.

### Pushing for the first time

```powershell
git remote add origin https://github.com/<username>/<repo>.git
git branch -M main
git push -u origin main
```

`CI` runs on pull requests and pushes to `main`: it builds the frontend and byte-compiles
the Python backend.

## Rebuilding the knowledge base

See [`RAG/README.md`](RAG/README.md).

## License

[MIT](LICENSE)
