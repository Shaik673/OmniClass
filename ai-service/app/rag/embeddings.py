from sentence_transformers import SentenceTransformer
import structlog
from typing import List

logger = structlog.get_logger()


class EmbeddingService:
    def __init__(self, model_name: str):
        self.model_name = model_name
        self.model: SentenceTransformer | None = None

    async def load(self):
        """Load the embedding model (blocking — called once at startup)."""
        import asyncio
        loop = asyncio.get_event_loop()
        self.model = await loop.run_in_executor(
            None, SentenceTransformer, self.model_name
        )
        logger.info("Embedding model ready", model=self.model_name)

    async def embed_text(self, text: str) -> List[float]:
        return (await self.embed_texts([text]))[0]

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not self.model:
            raise RuntimeError("Embedding model not loaded")
        import asyncio
        loop = asyncio.get_event_loop()
        embeddings = await loop.run_in_executor(
            None, lambda: self.model.encode(texts, convert_to_numpy=True).tolist()
        )
        return embeddings
