from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    environment: str = "development"
    fastapi_port: int = 8000

    # Internal auth
    internal_auth_secret: str

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017/omniclass"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Vector DB
    vector_db_url: str = "http://localhost:6333"
    vector_db_collection: str = "course_content"
    vector_dimensions: int = 384

    # Embedding
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # Primary LLM
    primary_model_url: str = "http://localhost:11434"
    primary_model_name: str = "llama2"
    primary_model_timeout_seconds: int = 30

    # Gemini Fallback
    gemini_api_key: Optional[str] = None
    gemini_model: str = "configure_your_gemini_model"
    gemini_fallback_enabled: bool = False
    gemini_timeout_seconds: int = 30
    gemini_max_tokens: int = 4096
    gemini_max_retries: int = 3

    # Quotas
    ai_daily_token_quota: int = 50000

    # Storage (for document ingestion)
    storage_provider: str = "s3"
    aws_region: Optional[str] = None
    aws_bucket_name: Optional[str] = None
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None

    log_level: str = "info"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
