from fastapi import APIRouter, Depends, Request
from app.dependencies import verify_internal_token, get_orchestrator, get_embedding_service, get_vector_db_from_request
from app.models.ai_models import TutorMessageRequest, TutorResponse, AITask
from app.rag.retrieval import retrieve_context
import structlog

logger = structlog.get_logger()
router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/message", response_model=TutorResponse)
async def tutor_message(
    request_body: TutorMessageRequest,
    req: Request,
):
    orchestrator = get_orchestrator(req)
    embedding_service = get_embedding_service(req)
    vector_db = get_vector_db_from_request(req)

    # Retrieve relevant course context
    context = []
    if request_body.course_id:
        context = await retrieve_context(
            query=request_body.message,
            course_id=request_body.course_id,
            institution_id=request_body.institution_id,
            embedding_service=embedding_service,
            vector_db=vector_db,
        )

    system_prompt = (
        "You are an AI learning tutor for OmniClass. Answer the student's question "
        "using the provided course content. Be clear, concise, and encouraging. "
        "If the course content doesn't contain enough information, say so honestly "
        "rather than making up facts. Cite sources when possible."
    )
    if request_body.lesson_context:
        system_prompt += f"\n\nCurrent lesson context: {request_body.lesson_context}"
    style_guidance = {
        "clear": "Use clear, conversational language.",
        "step_by_step": "Explain the reasoning in numbered, manageable steps.",
        "examples": "Use a concrete example or analogy to make the idea easier to understand.",
    }
    system_prompt += f"\n\nExplanation preference: {style_guidance[request_body.explanation_style]}"

    task = AITask(
        feature="tutor",
        system_prompt=system_prompt,
        messages=request_body.history + [{"role": "user", "content": request_body.message}],
        context_chunks=context,
        quality_threshold=0.6,
    )

    response = await orchestrator.complete(
        task=task,
        user_id=request_body.user_id,
        feature="tutor",
        institution_gemini_enabled=request_body.institution_gemini_enabled,
    )

    sources = [
        {"lesson_id": c.lesson_id, "excerpt": c.text[:200]}
        for c in response.sources
    ]

    return TutorResponse(content=response.content, sources=sources, provider=response.provider)
