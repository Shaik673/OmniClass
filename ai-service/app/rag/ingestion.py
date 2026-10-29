import re
import structlog
from typing import List
from dataclasses import dataclass
from app.config import settings

logger = structlog.get_logger()

RETRIEVAL_THRESHOLD = 0.35


@dataclass
class TextChunk:
    text: str
    token_count: int
    order: int


def chunk_text(content: str, chunk_size: int = 512, overlap: int = 64) -> List[TextChunk]:
    """Split text into overlapping chunks preserving sentence boundaries."""
    # Split into sentences
    sentences = re.split(r'(?<=[.!?])\s+', content.strip())
    chunks = []
    current_words = []
    chunk_order = 0

    for sentence in sentences:
        words = sentence.split()
        if len(current_words) + len(words) > chunk_size:
            if current_words:
                text = ' '.join(current_words)
                chunks.append(TextChunk(text=text, token_count=len(current_words), order=chunk_order))
                chunk_order += 1
                # Keep overlap
                current_words = current_words[-overlap:] if overlap > 0 else []
        current_words.extend(words)

    if current_words:
        text = ' '.join(current_words)
        chunks.append(TextChunk(text=text, token_count=len(current_words), order=chunk_order))

    return chunks


async def ingest_lesson(
    lesson_id: str,
    content: str,
    metadata: dict,
    embedding_service,
    vector_db,
):
    """Chunk, embed, and upsert lesson content into the vector DB."""
    chunks = chunk_text(content)
    if not chunks:
        logger.warning("No chunks produced for lesson", lesson_id=lesson_id)
        return

    texts = [c.text for c in chunks]
    embeddings = await embedding_service.embed_texts(texts)

    from qdrant_client.models import PointStruct
    points = [
        PointStruct(
            id=f"{lesson_id}_{i}",
            vector=embedding,
            payload={
                "lesson_id": lesson_id,
                "course_id": metadata.get("course_id"),
                "institution_id": metadata.get("institution_id"),
                "text": chunk.text,
                "order": chunk.order,
            },
        )
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]

    await vector_db.upsert(collection_name=settings.vector_db_collection, points=points)
    logger.info("Lesson indexed", lesson_id=lesson_id, chunks=len(chunks))
