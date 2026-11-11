"""
Upload the Space (app.py, requirements.txt, README.md) and the Chroma DB to
Hugging Face.

Usage (after `hf auth login`):
    python space/deploy.py <username>/<space-name>
"""

import sys
from pathlib import Path

from huggingface_hub import HfApi

HERE = Path(__file__).resolve().parent
DB_DIR = HERE.parent / "RAG" / "chroma_db"


def main():
    if len(sys.argv) != 2 or "/" not in sys.argv[1]:
        sys.exit("Usage: python space/deploy.py <username>/<space-name>")
    repo_id = sys.argv[1]
    api = HfApi()

    # Creates the Space if it does not exist yet (no-op otherwise).
    api.create_repo(repo_id, repo_type="space", space_sdk="gradio", exist_ok=True)

    print(f"Uploading app files to {repo_id} ...")
    api.upload_folder(
        repo_id=repo_id,
        repo_type="space",
        folder_path=HERE,
        allow_patterns=["app.py", "requirements.txt", "README.md"],
        commit_message="Update RAG chatbot app",
    )

    print(f"Uploading Chroma DB from {DB_DIR} ...")
    api.upload_folder(
        repo_id=repo_id,
        repo_type="space",
        folder_path=DB_DIR,
        path_in_repo="chroma_db",
        commit_message="Upload Chroma knowledge base",
    )
    print(f"Done: https://huggingface.co/spaces/{repo_id}")


if __name__ == "__main__":
    main()
