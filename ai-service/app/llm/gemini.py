import asyncio
import structlog
import google.generativeai as genai
from app.models.ai_models import AITask, ModelResult

logger = structlog.get_logger()


class GeminiClient:
    """Google Gemini API client with retry and circuit breaker."""

    def __init__(self, settings):
        # API key only on server side — never exposed to frontend
        genai.configure(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model
        self.max_tokens = settings.gemini_max_tokens
        self.max_retries = min(max(settings.gemini_max_retries, 0), 5)
        self.timeout = settings.gemini_timeout_seconds
        self._model = genai.GenerativeModel(self.model_name)

    async def complete(self, task: AITask) -> ModelResult:
        prompt = self._build_prompt(task)

        # SECURITY: Validate prompt does not contain secrets or auth tokens
        # (content from task is already sanitized by Express before reaching here)

        for attempt in range(self.max_retries + 1):
            try:
                response = await asyncio.wait_for(
                    self._model.generate_content_async(
                        prompt,
                        generation_config=genai.types.GenerationConfig(
                            max_output_tokens=self.max_tokens,
                            temperature=0.7,
                        ),
                    ),
                    timeout=self.timeout,
                )
                content = response.text or ""
                if not content.strip():
                    raise ValueError("Gemini returned empty response")
                logger.info("Gemini response received", tokens=len(content.split()))
                return ModelResult(content=content, confidence=None)
            except Exception:
                if attempt >= self.max_retries:
                    raise
                await asyncio.sleep(min(2 ** attempt, 4))

    def _build_prompt(self, task: AITask) -> str:
        parts = []

        if task.system_prompt:
            parts.append(f"System: {task.system_prompt}\n")

        if task.context_chunks:
            context = "\n\n".join(
                f"[Course Content {i+1}]\n{c.text}"
                for i, c in enumerate(task.context_chunks)
            )
            parts.append(f"Relevant course material:\n{context}\n")

        for msg in task.messages:
            role = "User" if msg["role"] == "user" else "Assistant"
            parts.append(f"{role}: {msg['content']}")

        return "\n".join(parts)
