from fastapi import APIRouter, Depends, Request
from app.dependencies import verify_internal_token, get_orchestrator, get_embedding_service, get_vector_db_from_request
from app.models.ai_models import SummarizeRequest, AITask
from app.rag.retrieval import retrieve_context
import structlog

logger = structlog.get_logger()
router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/summarize")
async def summarize(request_body: SummarizeRequest, req: Request):
    orchestrator = get_orchestrator(req)
    embedding_service = get_embedding_service(req)
    vector_db = get_vector_db_from_request(req)

    if request_body.source_type == "lesson" and request_body.lesson_id:
        context = await retrieve_context(
            query="key concepts and summary",
            course_id=request_body.course_id,
            institution_id=request_body.institution_id,
            embedding_service=embedding_service,
            vector_db=vector_db,
            top_k=10,
        )
        source_text = "\n\n".join(c.text for c in context)
    elif request_body.content:
        source_text = request_body.content
        context = []
    else:
        return {"success": False, "error": {"message": "No source content provided"}}

    task = AITask(
        feature="summarizer",
        system_prompt=(
            "Summarize the following course content. Return a structured response with sections: "
            "1) Summary (2-3 paragraphs), 2) Key Concepts (bullet list), "
            "3) Revision Points (bullet list). "
            "Only include information from the provided source. Do not add unsupported claims."
        ),
        messages=[{"role": "user", "content": f"Summarize this content:\n\n{source_text[:8000]}"}],
        context_chunks=context,
        quality_threshold=0.4,
    )

    response = await orchestrator.complete(task=task, user_id=request_body.user_id, feature="summarizer")
    return {"success": True, "data": {"summary": response.content, "provider": response.provider}}
