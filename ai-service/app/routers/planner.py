from fastapi import APIRouter, Depends, Request
from app.dependencies import verify_internal_token, get_orchestrator
from app.models.ai_models import StudyPlanRequest, AITask
import structlog, json

logger = structlog.get_logger()
router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/generate")
async def generate_study_plan(request_body: StudyPlanRequest, req: Request):
    orchestrator = get_orchestrator(req)

    context_str = json.dumps({
        "courses": request_body.courses,
        "deadlines": request_body.deadlines,
        "progress": request_body.progress,
        "study_hours_per_week": request_body.study_hours_per_week,
        "preferences": request_body.preferences,
    }, default=str)

    task = AITask(
        feature="planner",
        system_prompt=(
            "You are an AI study planner. Generate a practical weekly study plan "
            "based on the student's courses, deadlines, progress, and available time. "
            "Return a JSON object with 'sessions' array (each with date, duration_minutes, "
            "course_id, topic, type) and 'goals' array. "
            "Never modify official deadlines. Distinguish AI suggestions from mandatory deadlines."
        ),
        messages=[{"role": "user", "content": f"Generate a study plan based on this data:\n{context_str}"}],
        quality_threshold=0.5,
    )

    response = await orchestrator.complete(task=task, user_id=request_body.user_id, feature="planner")
    return {"success": True, "data": {"plan": response.content, "provider": response.provider}}
