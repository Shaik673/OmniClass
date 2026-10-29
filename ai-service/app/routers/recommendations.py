from fastapi import APIRouter, Depends, Request
from app.dependencies import verify_internal_token, get_orchestrator
from app.models.ai_models import RecommendationRequest, AITask
import structlog, json

logger = structlog.get_logger()
router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/")
async def get_recommendations(request_body: RecommendationRequest, req: Request):
    orchestrator = get_orchestrator(req)

    # Filter available courses: exclude already enrolled/completed
    excluded = set(request_body.completed_course_ids + request_body.enrolled_course_ids)
    candidates = [c for c in request_body.available_courses if c.get("id") not in excluded]

    if not candidates:
        return {"success": True, "data": {"recommendations": [], "reason": "No available courses"}}

    context = json.dumps({
        "interests": request_body.interests,
        "performance": request_body.performance,
        "available_courses": candidates[:20],  # cap to avoid token overflow
    }, default=str)

    task = AITask(
        feature="recommendations",
        system_prompt=(
            "You are a course recommendation engine. Based on the student's interests and performance, "
            "recommend up to 5 courses from the available list. "
            "Return a JSON array where each item has: course_id, reason (1 sentence explaining why). "
            "Only recommend courses from the provided list. Respect prerequisites and eligibility."
        ),
        messages=[{"role": "user", "content": f"Recommend courses based on:\n{context}"}],
        quality_threshold=0.4,
    )

    response = await orchestrator.complete(task=task, user_id=request_body.user_id, feature="recommendations")
    return {"success": True, "data": {"recommendations": response.content, "provider": response.provider}}
