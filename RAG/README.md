# RAG — knowledge base

Source material and the vector store used by `space/app.py`.

```
Document_Loader.ipynb   Builds chroma_db from the text files
Text_Document/          Khmer Grade 12 source text (History, Morality-Civics, Tum Teav)
chroma_db/              Persistent Chroma store, collection "khmer_corpus" (411 chunks)
requirements.txt        Dependencies for rebuilding the index
```

## Rebuilding the index

```powershell
pip install -r RAG/requirements.txt
cd RAG
jupyter lab Document_Loader.ipynb    # run all cells
```

The notebook chunks each document (2000 chars, 200 overlap, split on `។ ? !`), embeds passages
with `intfloat/multilingual-e5-base` using the E5 `"passage: "` prefix, and writes a cosine
collection named `khmer_corpus` into `./chroma_db`.

`space/app.py` must embed queries with the matching `"query: "` prefix — keep the two in sync
if you change models.

`chroma_db/` is committed so the repo is self-contained; it is ~13 MB. To regenerate it from
scratch, delete the folder and re-run the notebook.
