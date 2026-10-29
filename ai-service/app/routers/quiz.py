from fastapi import APIRouter, Depends, Request
from app.dependencies import verify_internal_token, get_orchestrator, get_embedding_service, get_vector_db_from_request
from app.models.ai_models import QuizGenerateRequest, AITask
from app.rag.retrieval import retrieve_context
import structlog

logger = structlog.get_logger()
router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/generate")
async def generate_quiz(request_body: QuizGenerateRequest, req: Request):
    orchestrator = get_orchestrator(req)
    embedding_service = get_embedding_service(req)
    vector_db = get_vector_db_from_request(req)

    context = await retrieve_context(
        query=request_body.topic,
        course_id=request_body.course_id,
        institution_id=request_body.institution_id,
        embedding_service=embedding_service,
        vector_db=vector_db,
        top_k=8,
    )

    types_str = ", ".join(request_body.question_types)
    task = AITask(
        feature="quiz_gen",
        system_prompt=(
            f"Generate {request_body.count} quiz questions about '{request_body.topic}' "
            f"at {request_body.difficulty} difficulty. Question types: {types_str}. "
            "Return a JSON array where each question has: type, text, options (array with id/text/isCorrect/explanation), "
            "correctAnswer, points, difficulty, explanation. "
            "Base questions on the provided course content only. Do not fabricate facts."
        ),
        messages=[{"role": "user", "content": f"Generate quiz questions about: {request_body.topic}"}],
        context_chunks=context,
        quality_threshold=0.5,
    )

    response = await orchestrator.complete(task=task, user_id=request_body.user_id, feature="quiz_gen")
    return {"success": True, "data": {"questions": response.content, "provider": response.provider}}
