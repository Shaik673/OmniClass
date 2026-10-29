from fastapi import APIRouter, Depends, Request
from app.dependencies import verify_internal_token, get_orchestrator
from app.models.ai_models import CopilotRequest, AITask
import structlog

logger = structlog.get_logger()
router = APIRouter(dependencies=[Depends(verify_internal_token)])

TASK_PROMPTS = {
    "describe": "Draft a compelling course description based on the provided topic and context. Be informative and engaging.",
    "outline": "Create a structured lesson outline with sections, key points, and estimated durations.",
    "rubric": "Generate a grading rubric with criteria, descriptions, and point levels (Excellent/Good/Needs Improvement/Poor).",
    "question": "Generate thoughtful assessment questions with answers and explanations suitable for the topic.",
    "announcement": "Draft a clear, professional course announcement for students.",
    "performance_summary": "Summarize student performance trends based on the provided aggregated data.",
}


@router.post("/assist")
async def copilot_assist(request_body: CopilotRequest, req: Request):
    orchestrator = get_orchestrator(req)

    task_prompt = TASK_PROMPTS.get(request_body.task_type, "Assist with the following instructor task:")

    task = AITask(
        feature="copilot",
        system_prompt=(
            f"You are an AI Instructor Copilot for OmniClass. {task_prompt} "
            "Return a draft for the instructor to review. Clearly label it as a draft suggestion. "
            "The instructor must review, edit, and approve before publishing."
        ),
        messages=[{"role": "user", "content": f"Task: {request_body.task_type}\n\nContext:\n{request_body.context}"}],
        quality_threshold=0.5,
    )

    response = await orchestrator.complete(task=task, user_id=request_body.user_id, feature="copilot")
    return {
        "success": True,
        "data": {
            "draft": response.content,
            "task_type": request_body.task_type,
            "provider": response.provider,
            "is_draft": True,
        },
    }
