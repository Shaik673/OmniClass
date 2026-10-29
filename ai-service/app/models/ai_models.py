from pydantic import BaseModel
from typing import Optional, List, Any, Literal


class RetrievedChunk(BaseModel):
    chunk_id: str
    lesson_id: str
    text: str
    score: float


class AITask(BaseModel):
    feature: str
    system_prompt: Optional[str] = None
    messages: List[dict] = []
    context_chunks: List[RetrievedChunk] = []
    quality_threshold: float = 0.5


class ModelResult(BaseModel):
    content: str
    confidence: Optional[float] = None


class AIResponse(BaseModel):
    content: str
    provider: str  # 'primary' | 'gemini'
    sources: List[RetrievedChunk] = []
    fallback_reason: Optional[str] = None


class TutorMessageRequest(BaseModel):
    message: str
    course_id: Optional[str] = None
    explanation_style: Literal["clear", "step_by_step", "examples"] = "clear"
    lesson_id: Optional[str] = None
    history: List[dict] = []
    user_id: str
    institution_id: str
    lesson_context: Optional[str] = None
    institution_gemini_enabled: bool = False


class TutorResponse(BaseModel):
    content: str
    sources: List[dict] = []
    provider: str


class StudyPlanRequest(BaseModel):
    user_id: str
    institution_id: str
    courses: List[dict] = []
    deadlines: List[dict] = []
    progress: List[dict] = []
    study_hours_per_week: int = 10
    preferences: dict = {}


class QuizGenerateRequest(BaseModel):
    topic: str
    course_id: str
    institution_id: str
    user_id: str
    difficulty: str = "medium"
    question_types: List[str] = ["single_choice"]
    count: int = 5


class SummarizeRequest(BaseModel):
    source_type: str  # 'lesson' | 'document'
    course_id: Optional[str] = None
    lesson_id: Optional[str] = None
    content: Optional[str] = None
    file_key: Optional[str] = None
    user_id: str
    institution_id: str


class CopilotRequest(BaseModel):
    task_type: str  # 'describe' | 'outline' | 'rubric' | 'question' | 'announcement' | 'performance_summary'
    context: str
    course_id: Optional[str] = None
    user_id: str
    institution_id: str


class FeedbackRequest(BaseModel):
    submission_content: str
    assignment_instructions: str
    rubric: List[dict] = []
    user_id: str
    institution_id: str
    language: Optional[str] = None


class RecommendationRequest(BaseModel):
    user_id: str
    institution_id: str
    interests: List[str] = []
    completed_course_ids: List[str] = []
    enrolled_course_ids: List[str] = []
    performance: dict = {}
    available_courses: List[dict] = []
