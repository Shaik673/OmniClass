from fastapi import APIRouter, Depends, Request
from app.dependencies import verify_internal_token, get_orchestrator
from app.models.ai_models import FeedbackRequest, AITask
import structlog, json

logger = structlog.get_logger()
router = APIRouter(dependencies=[Depends(verify_internal_token)])


@router.post("/analyze")
async def analyze_feedback(request_body: FeedbackRequest, req: Request):
    orchestrator = get_orchestrator(req)

    rubric_str = json.dumps(request_body.rubric, indent=2) if request_body.rubric else "No rubric provided."

    task = AITask(
        feature="feedback",
        system_prompt=(
            "You are an AI feedback assistant for OmniClass. Analyze the student submission against "
            "the assignment instructions and rubric. Return a JSON object with: "
            "'rubric_feedback' (array of {criterion, observation, suggestion}), "
            "'overall_suggestions' (array of strings), "
            "'ai_suggested_marks' (number or null), "
            "'limitations' (string — any areas you cannot assess confidently). "
            "Be constructive and specific. Never accuse of plagiarism. "
            "Clearly state this is AI feedback, not an official grade."
        ),
        messages=[{
            "role": "user",
            "content": (
                f"Assignment Instructions:\n{request_body.assignment_instructions}\n\n"
                f"Rubric:\n{rubric_str}\n\n"
                f"Student Submission:\n{request_body.submission_content[:6000]}"
            ),
        }],
        quality_threshold=0.5,
    )

    response = await orchestrator.complete(task=task, user_id=request_body.user_id, feature="feedback")
    return {
        "success": True,
        "data": {
            "feedback": response.content,
            "provider": response.provider,
            "is_official_grade": False,
        },
    }
