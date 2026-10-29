import httpx
import structlog
from app.models.ai_models import AITask, ModelResult

logger = structlog.get_logger()


class PrimaryModel:
    """Interface for the local/internal LLM (e.g. Ollama)."""

    def __init__(self, settings):
        self.url = settings.primary_model_url
        self.model = settings.primary_model_name
        self.timeout = settings.primary_model_timeout_seconds

    async def complete(self, task: AITask) -> ModelResult:
        messages = self._build_messages(task)

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(
                f"{self.url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False,
                    "options": {"num_predict": 2048},
                },
            )
            resp.raise_for_status()
            data = resp.json()

        content = data.get("message", {}).get("content", "")
        return ModelResult(content=content, confidence=None)

    def _build_messages(self, task: AITask) -> list:
        msgs = []
        if task.system_prompt:
            msgs.append({"role": "system", "content": task.system_prompt})

        # Inject retrieved context
        if task.context_chunks:
            context_text = "\n\n".join(
                f"[Source {i+1} — Lesson {c.lesson_id}]\n{c.text}"
                for i, c in enumerate(task.context_chunks)
            )
            msgs.append({
                "role": "system",
                "content": f"Use the following course content to inform your response:\n\n{context_text}",
            })

        msgs.extend(task.messages)
        return msgs
