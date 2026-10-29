from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.get("/health")
async def health_check(request: Request):
    checks = {"ai_service": "ok", "embedding_model": "unknown", "vector_db": "unknown", "redis": "unknown"}

    # Embedding model
    try:
        svc = request.app.state.embedding_service
        if svc and svc.model:
            checks["embedding_model"] = "ok"
    except Exception:
        checks["embedding_model"] = "error"

    # Vector DB
    try:
        vdb = request.app.state.vector_db
        await vdb.get_collections()
        checks["vector_db"] = "ok"
    except Exception:
        checks["vector_db"] = "error"

    # Redis
    try:
        r = request.app.state.redis
        await r.ping()
        checks["redis"] = "ok"
    except Exception:
        checks["redis"] = "error"

    all_ok = all(v == "ok" for v in checks.values())
    return JSONResponse(
        status_code=200 if all_ok else 207,
        content={
            "success": all_ok,
            "data": {"status": "healthy" if all_ok else "degraded", "checks": checks},
        },
    )
