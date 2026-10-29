from fastapi import Header, HTTPException, Request
from qdrant_client import AsyncQdrantClient
from redis.asyncio import Redis as AsyncRedis
from app.config import settings


async def get_vector_db() -> AsyncQdrantClient:
    client = AsyncQdrantClient(url=settings.vector_db_url)
    # Ensure collection exists
    try:
        collections = await client.get_collections()
        names = [c.name for c in collections.collections]
        if settings.vector_db_collection not in names:
            from qdrant_client.models import VectorParams, Distance
            await client.create_collection(
                collection_name=settings.vector_db_collection,
                vectors_config=VectorParams(
                    size=settings.vector_dimensions,
                    distance=Distance.COSINE,
                ),
            )
    except Exception:
        pass  # Handled at startup
    return client


async def get_redis_client() -> AsyncRedis:
    return AsyncRedis.from_url(settings.redis_url, decode_responses=True)


async def verify_internal_token(x_internal_secret: str = Header(...)):
    """Protect all FastAPI endpoints from direct public access."""
    if x_internal_secret != settings.internal_auth_secret:
        raise HTTPException(status_code=403, detail="Invalid internal secret")


def get_orchestrator(request: Request):
    return request.app.state.orchestrator


def get_embedding_service(request: Request):
    return request.app.state.embedding_service


def get_vector_db_from_request(request: Request):
    return request.app.state.vector_db


def get_redis_from_request(request: Request):
    return request.app.state.redis
