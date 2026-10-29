import structlog
from typing import List
from app.models.ai_models import RetrievedChunk
from app.config import settings
from app.rag.ingestion import RETRIEVAL_THRESHOLD

logger = structlog.get_logger()


async def retrieve_context(
    query: str,
    course_id: str,
    institution_id: str,
    embedding_service,
    vector_db,
    top_k: int = 5,
) -> List[RetrievedChunk]:
    """Semantic search with mandatory tenant isolation filter."""
    query_embedding = await embedding_service.embed_text(query)

    from qdrant_client.models import Filter, FieldCondition, MatchValue
    results = await vector_db.search(
        collection_name=settings.vector_db_collection,
        query_vector=query_embedding,
        query_filter=Filter(
            must=[
                FieldCondition(key="course_id",      match=MatchValue(value=course_id)),
                FieldCondition(key="institution_id", match=MatchValue(value=institution_id)),
            ]
        ),
        limit=top_k,
        with_payload=True,
    )

    chunks = [
        RetrievedChunk(
            chunk_id=str(r.id),
            lesson_id=r.payload.get("lesson_id", ""),
            text=r.payload.get("text", ""),
            score=r.score,
        )
        for r in results
        if r.score >= RETRIEVAL_THRESHOLD
    ]

    logger.info("Context retrieved", query_len=len(query), chunks=len(chunks), course_id=course_id)
    return chunks
