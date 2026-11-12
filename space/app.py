"""
Khmer Grade 12 Education Chatbot — Hugging Face Space backend (ZeroGPU).

RAG pipeline:
  1. Embed the question with intfloat/multilingual-e5-base ("query: " prefix,
     normalized) — identical to how RAG/chroma_db was built.
  2. Retrieve the top-k chunks from the Chroma collection "khmer_corpus".
  3. Generate a grounded answer with Qwen/Qwen2.5-1.5B-Instruct (streaming).

Exposes:
  * A Gradio chat UI (for testing directly on the Space page).
  * A named API endpoint `/chat` used by the React frontend:
        inputs : message (str), history_json (str, JSON list of {role, content})
        output : JSON {"answer": str, "sources": [...], "done": bool}  (streamed)
"""

import json
import os
from pathlib import Path
from threading import Thread

import chromadb
import gradio as gr
import torch
from sentence_transformers import SentenceTransformer
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer

# ZeroGPU decorator. The `spaces` package is installed from requirements.txt.
# When running locally without it, fall back to a no-op decorator.
try:
    import spaces
except ImportError:
    class _MockSpaces:
        def GPU(self, *args, **kwargs):
            def decorator(fn):
                return fn
            return decorator
    spaces = _MockSpaces()

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen2.5-1.5B-Instruct")
EMBED_MODEL_ID = os.getenv("EMBED_MODEL_ID", "intfloat/multilingual-e5-base")
_HERE = Path(__file__).resolve().parent
CHROMA_DIR = os.getenv("CHROMA_DIR") or str(
    _HERE / "chroma_db" if (_HERE / "chroma_db").exists() else _HERE.parent / "RAG" / "chroma_db"
)
COLLECTION = os.getenv("CHROMA_COLLECTION", "khmer_corpus")
TOP_K = int(os.getenv("TOP_K", "3"))
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "768"))
MAX_HISTORY_TURNS = 4
SNIPPET_CHARS = 600

SUBJECTS = {
    "History": "ប្រវត្តិវិទ្យា (History)",
    "Morality-Civics": "សីលធម៌-ពលរដ្ឋវិជ្ជា (Morality & Civics)",
    "Tum_Teav": "អក្សរសាស្ត្រខ្មែរ រឿងទុំទាវ (Khmer Literature)",
}

SYSTEM_PROMPT = (
    "អ្នកគឺជាគ្រូជំនួយការដ៏ឆ្លាតវៃ សម្រាប់សិស្សថ្នាក់ទី១២ នៅកម្ពុជា។ "
    "ចូរឆ្លើយជាភាសាខ្មែរ ឲ្យច្បាស់លាស់ ខ្លី និងងាយយល់។ "
    "ប្រើតែព័ត៌មានពី «ឯកសារយោង» ខាងក្រោម។ "
    "ប្រសិនបើឯកសារយោងមិនមានចម្លើយ ចូរប្រាប់ដោយស្មោះត្រង់ថាអ្នកមិនដឹង។\n"
    "You are a helpful tutor for Cambodian Grade 12 students. Answer in Khmer "
    "unless the student writes in another language. Base your answer only on the "
    "reference documents provided; if they do not contain the answer, say so."
)

# ---------------------------------------------------------------------------
# Load models & vector store (module scope — runs once at boot)
# ---------------------------------------------------------------------------
print(f"Loading embedding model {EMBED_MODEL_ID} on CPU ...")
embedder = SentenceTransformer(EMBED_MODEL_ID, device="cpu")

print(f"Opening Chroma DB at {CHROMA_DIR} ...")
chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
collection = chroma_client.get_collection(COLLECTION)
print(f"Collection '{COLLECTION}' has {collection.count()} chunks.")

print(f"Loading LLM {MODEL_ID} ...")
load_device = "cuda" if torch.cuda.is_available() else "cpu"
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    dtype=torch.float16 if load_device == "cuda" else torch.float32,
)
model.to(load_device)
model.eval()
print(f"Model {MODEL_ID} loaded successfully on {load_device}.")


# ---------------------------------------------------------------------------
# Retrieval & Prompt Helpers
# ---------------------------------------------------------------------------
def _subject_from_source(source: str) -> str:
    stem = Path(str(source).replace("\\", "/")).stem
    return SUBJECTS.get(stem, stem)


def retrieve(query: str, k: int = TOP_K):
    """Return top-k passages matching query."""
    emb = embedder.encode(
        [f"query: {query}"], normalize_embeddings=True
    ).tolist()
    res = collection.query(
        query_embeddings=emb,
        n_results=k,
        include=["documents", "metadatas", "distances"],
    )
    hits = []
    for doc, meta, dist in zip(
        res["documents"][0], res["metadatas"][0], res["distances"][0]
    ):
        source = (meta or {}).get("source", "")
        hits.append(
            {
                "text": doc,
                "source": Path(str(source).replace("\\", "/")).name,
                "subject": _subject_from_source(source),
                "score": round(1.0 - float(dist), 4),
            }
        )
    return hits


def _content_to_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, dict):
        return content.get("text") or content.get("content") or ""
    if isinstance(content, (list, tuple)):
        return " ".join(_content_to_text(c) for c in content if c)
    return "" if content is None else str(content)


def normalize_history(history):
    messages = []
    for item in history or []:
        if isinstance(item, dict):
            role = item.get("role")
            text = _content_to_text(item.get("content"))
            if role in ("user", "assistant") and text:
                messages.append({"role": role, "content": text})
        elif isinstance(item, (list, tuple)) and len(item) == 2:
            human, assistant = item
            if human:
                messages.append({"role": "user", "content": _content_to_text(human)})
            if assistant:
                messages.append(
                    {"role": "assistant", "content": _content_to_text(assistant)}
                )
    return messages[-MAX_HISTORY_TURNS * 2 :]


def build_messages(message: str, history, hits):
    context = "\n\n".join(
        f"[{i + 1}] ({h['subject']})\n{h['text']}" for i, h in enumerate(hits)
    )
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(normalize_history(history))
    messages.append(
        {
            "role": "user",
            "content": f"ឯកសារយោង (Reference documents):\n{context}\n\n"
            f"សំណួរ (Question): {message}",
        }
    )
    return messages


# ---------------------------------------------------------------------------
# GPU Inference Function (ZeroGPU)
# ---------------------------------------------------------------------------
@spaces.GPU(duration=120)
def generate_stream(messages):
    """Stream tokens from Qwen. Runs on GPU under ZeroGPU."""
    text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    device = next(model.parameters()).device
    inputs = tokenizer([text], return_tensors="pt").to(device)
    streamer = TextIteratorStreamer(
        tokenizer, skip_prompt=True, skip_special_tokens=True, timeout=120
    )
    kwargs = dict(
        **inputs,
        streamer=streamer,
        max_new_tokens=MAX_NEW_TOKENS,
        do_sample=True,
        temperature=0.3,
        top_p=0.9,
        repetition_penalty=1.1,
    )
    thread = Thread(target=model.generate, kwargs=kwargs)
    thread.start()
    partial = ""
    for new_text in streamer:
        partial += new_text
        yield partial
    thread.join()


# ---------------------------------------------------------------------------
# Gradio & API Endpoints
# ---------------------------------------------------------------------------
def api_chat(message: str, history_json: str = "[]"):
    """
    HTTP / Gradio Client API endpoint for external frontends.
    Inputs:
      - message (str): User's question
      - history_json (str): JSON-encoded list of previous {role, content}
    Yields:
      - JSON dict: {"answer": str, "sources": list, "done": bool}
    """
    message = (message or "").strip()
    if not message:
        yield {"answer": "", "sources": [], "done": True}
        return
    try:
        history = json.loads(history_json) if history_json else []
    except json.JSONDecodeError:
        history = []

    hits = retrieve(message)
    sources = [
        {**h, "text": h["text"][:SNIPPET_CHARS]} for h in hits
    ]
    yield {"answer": "", "sources": sources, "done": False}

    answer = ""
    for answer in generate_stream(build_messages(message, history, hits)):
        yield {"answer": answer, "sources": sources, "done": False}
    yield {"answer": answer, "sources": sources, "done": True}


def ui_chat(message, history):
    """Endpoint for the built-in Gradio ChatInterface web page."""
    hits = retrieve(message)
    for partial in generate_stream(build_messages(message, history, hits)):
        yield partial


with gr.Blocks(title="Khmer Grade 12 Tutor API") as demo:
    gr.Markdown(
        "# 🎓 ជំនួយការសិក្សា ថ្នាក់ទី១២ (Khmer Grade 12 Tutor)\n"
        "AI Education Chatbot powered by **Qwen2.5-1.5B-Instruct** + **RAG ChromaDB**.\n\n"
        "This space serves both as an interactive chatbot and as an API backend for React frontend."
    )
    gr.ChatInterface(
        fn=ui_chat,
        textbox=gr.Textbox(placeholder="សួរសំណួរមេរៀនថ្នាក់ទី១២..."),
    )

    # Exposed API endpoint named "/chat" for React / external apps
    with gr.Row(visible=False):
        api_message = gr.Textbox(label="message")
        api_history = gr.Textbox(value="[]", label="history_json")
        api_output = gr.JSON(label="output")
        api_button = gr.Button()
    api_button.click(
        api_chat,
        inputs=[api_message, api_history],
        outputs=api_output,
        api_name="chat",
    )

demo.queue(default_concurrency_limit=1)

if __name__ == "__main__":
    demo.launch()
