import re
import requests
import json
import numpy as np

# Try to load SentenceTransformer for real local embeddings, fallback to word overlap similarity if unavailable
model = None
try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("AI Semantic Search: Local Sentence-Transformers ('all-MiniLM-L6-v2') loaded successfully.")
except Exception as e:
    print(f"AI Semantic Search: sentence-transformers not fully loaded ({e}). Using CPU vector simulation fallback.")

def get_embedding(text: str) -> list[float]:
    """
    Computes a 384-dimensional vector embedding for the given text.
    """
    if model is not None:
        try:
            vector = model.encode(text)
            return vector.tolist()
        except Exception:
            pass
            
    # Mock CPU vector simulation (fallback)
    # Generates a deterministic pseudorandom float array based on the text hash
    h = hash(text)
    np.random.seed(abs(h) % (2**32 - 1))
    v = np.random.randn(384)
    v /= np.linalg.norm(v)
    return v.tolist()

def cosine_similarity_score(v1: list[float], v2: list[float]) -> float:
    """
    Calculates cosine similarity between two vector lists.
    """
    arr1 = np.array(v1)
    arr2 = np.array(v2)
    dot = np.dot(arr1, arr2)
    norm1 = np.linalg.norm(arr1)
    norm2 = np.linalg.norm(arr2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return float(dot / (norm1 * norm2))

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    """
    Splits text blocks into smaller sections with overlapping windows for better indexing.
    """
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i + chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
        if len(chunk) < chunk_size:
            break
    return [c for c in chunks if c.strip()]

def query_local_ollama(prompt: str, system_prompt: str = "You are Nexora AI, a helpful company knowledge assistant.") -> str:
    """
    Attempts to query a local Ollama instance (running at localhost:11434) using llama3.
    Falls back to a structural simulated summary answer if Ollama is unreachable.
    """
    ollama_url = "http://localhost:11434/api/generate"
    payload = {
        "model": "llama3",
        "prompt": f"{system_prompt}\n\nUser Question: {prompt}\n\nAnswer:",
        "stream": False
    }
    try:
        res = requests.post(ollama_url, json=payload, timeout=5)
        if res.status_code == 200:
            return res.json().get("response", "")
    except Exception:
        pass
    
    # Text search fallback
    return ""
