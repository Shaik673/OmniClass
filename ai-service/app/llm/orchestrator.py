import asyncio
import structlog
from typing import Optional
from app.llm.primary import PrimaryModel
from app.llm.gemini import GeminiClient
from app.models.ai_models import AITask, AIResponse

logger = structlog.get_logger()


class AIOrchestrator:
    def __init__(self, settings, embedding_service):
        self.settings = settings
        self.embedding_service = embedding_service
        self.primary = PrimaryModel(settings)
        self.gemini = GeminiClient(settings) if settings.gemini_api_key else None

    async def complete(
        self,
        task: AITask,
        user_id: str,
        feature: str,
        institution_gemini_enabled: bool = False,
    ) -> AIResponse:

        # Attempt primary model
        primary_error = None
        try:
            primary_result = await asyncio.wait_for(
                self.primary.complete(task),
                timeout=self.settings.primary_model_timeout_seconds,
            )
            if self._is_adequate(primary_result, task.quality_threshold):
                logger.info("AI request served by primary", feature=feature, user_id=user_id)
                return AIResponse(
                    content=primary_result.content,
                    provider="primary",
                    sources=task.context_chunks,
                )
            primary_error = "inadequate_response"
        except asyncio.TimeoutError:
            primary_error = "timeout"
            logger.warning("Primary model timeout", feature=feature)
        except Exception as e:
            primary_error = str(e)
            logger.warning("Primary model error", feature=feature, error=str(e))

        # Check fallback eligibility
        if not self.settings.gemini_fallback_enabled:
            raise AIServiceUnavailable("Primary model unavailable and Gemini fallback is disabled globally")
        if not institution_gemini_enabled:
            raise AIServiceUnavailable("Primary model unavailable and Gemini fallback is disabled for this institution")
        if self.gemini is None:
            raise AIServiceUnavailable("Gemini API key not configured")

        # Gemini fallback
        logger.info("Falling back to Gemini", feature=feature, reason=primary_error)
        gemini_result = await self.gemini.complete(task)
        return AIResponse(
            content=gemini_result.content,
            provider="gemini",
            sources=task.context_chunks,
            fallback_reason=primary_error,
        )

    def _is_adequate(self, result, threshold: float) -> bool:
        # A short or low-confidence answer can still be valid. Only use the
        # generic check for an empty/unusable payload; structured and
        # feature-specific validation belongs with the corresponding router.
        return bool(result and isinstance(result.content, str) and result.content.strip())


class AIServiceUnavailable(Exception):
    pass
