from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog
import time

from app.config import settings
from app.routers import health, tutor, planner, quiz, summarizer, copilot, feedback, voice, recommendations
from app.rag.embeddings import EmbeddingService
from app.llm.orchestrator import AIOrchestrator
from app.dependencies import get_vector_db, get_redis_client

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    logger.info("Starting OmniClass AI Service", env=settings.environment)

    # Initialize embedding model
    app.state.embedding_service = EmbeddingService(settings.embedding_model)
    await app.state.embedding_service.load()
    logger.info("Embedding model loaded", model=settings.embedding_model)

    # Initialize vector DB client
    app.state.vector_db = await get_vector_db()
    logger.info("Vector DB connected", url=settings.vector_db_url)

    # Initialize Redis
    app.state.redis = await get_redis_client()
    logger.info("Redis connected")

    # Initialize AI orchestrator
    app.state.orchestrator = AIOrchestrator(settings, app.state.embedding_service)
    logger.info("AI orchestrator ready")

    yield

    # Shutdown
    await app.state.redis.aclose()
    logger.info("OmniClass AI Service shutdown complete")


app = FastAPI(
    title="OmniClass AI Service",
    version="1.0.0",
    docs_url="/ai/docs" if settings.environment == "development" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],  # Only internal — no CORS needed
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(duration_ms)
    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=duration_ms,
    )
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc), path=request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}},
    )


# ─── Routers ─────────────────────────────────────────────────
app.include_router(health.router,          prefix="/ai")
app.include_router(tutor.router,           prefix="/ai/tutor",           tags=["Tutor"])
app.include_router(planner.router,         prefix="/ai/planner",         tags=["Planner"])
app.include_router(quiz.router,            prefix="/ai/quiz-generator",  tags=["Quiz"])
app.include_router(summarizer.router,      prefix="/ai/summarizer",      tags=["Summarizer"])
app.include_router(copilot.router,         prefix="/ai/copilot",         tags=["Copilot"])
app.include_router(feedback.router,        prefix="/ai/feedback",        tags=["Feedback"])
app.include_router(voice.router,           prefix="/ai/voice",           tags=["Voice"])
app.include_router(recommendations.router, prefix="/ai/recommendations", tags=["Recommendations"])
