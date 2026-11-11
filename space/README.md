---
title: Khmer Grade 12 Tutor
emoji: 🎓
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: 6.5.1
app_file: app.py
pinned: false
short_description: Khmer Grade 12 RAG tutor (Qwen2.5-1.5B + Chroma)
---

# 🎓 ជំនួយការសិក្សា ថ្នាក់ទី១២ — Khmer Grade 12 Tutor

RAG chatbot over the Grade 12 textbooks (History, Morality-Civics, Tum Teav).

- LLM: `Qwen/Qwen2.5-1.5B-Instruct` (ZeroGPU)
- Embeddings: `intfloat/multilingual-e5-base`
- Vector store: Chroma (`chroma_db/`, collection `khmer_corpus`)

API endpoint for React / external apps: `/chat(message: str, history_json: str) -> JSON`
