"""Local deterministic retrieval tools; no extra agent or model downloads.

Existing vectors are preserved. Search re-encodes source text to avoid mixing
old randomized/transformer vectors with the stable token encoder.
"""
import hashlib
import math
import re


def get_embedding(text: str) -> list[float]:
    vector = [0.0] * 384
    for token in re.findall(r"\w+", text.casefold()):
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        vector[int.from_bytes(digest[:4], "big") % len(vector)] += 1
    norm = math.sqrt(sum(value * value for value in vector))
    return [value / norm for value in vector] if norm else vector


def cosine_similarity_score(v1: list[float], v2: list[float]) -> float:
    if len(v1) != len(v2):
        raise ValueError("Vector dimensions must match")
    norm = math.sqrt(sum(x*x for x in v1) * sum(x*x for x in v2))
    return sum(x*y for x, y in zip(v1, v2)) / norm if norm else 0.0


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 100) -> list[str]:
    if chunk_size <= 0 or not 0 <= overlap < chunk_size:
        raise ValueError("Require chunk_size > 0 and 0 <= overlap < chunk_size")
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunks.append(" ".join(words[i:i + chunk_size]))
        if i + chunk_size >= len(words):
            break
    return chunks
