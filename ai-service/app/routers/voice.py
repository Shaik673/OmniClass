from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import verify_internal_token
from pydantic import BaseModel
from typing import Optional
import structlog

logger = structlog.get_logger()
router = APIRouter(dependencies=[Depends(verify_internal_token)])


class TranscribeRequest(BaseModel):
    audio_base64: str
    language: Optional[str] = "en"
    user_id: str


class SynthesizeRequest(BaseModel):
    text: str
    language: Optional[str] = "en"
    user_id: str


@router.post("/transcribe")
async def transcribe_audio(request_body: TranscribeRequest):
    """
    Speech-to-text transcription.
    Delegates to configured STT provider (Whisper API or similar).
    Audio is processed server-side only — never stored permanently.
    """
    # NOTE: Integrate with Whisper API or Google STT via env-configured provider
    # Placeholder implementation — wire up STT provider in production
    logger.info("STT request received", user_id=request_body.user_id, lang=request_body.language)
    raise HTTPException(
        status_code=501,
        detail="STT provider not configured. Set SPEECH_PROVIDER in environment variables.",
    )


@router.post("/synthesize")
async def synthesize_speech(request_body: SynthesizeRequest):
    """
    Text-to-speech synthesis.
    Returns audio URL or base64 audio from configured TTS provider.
    """
    logger.info("TTS request received", user_id=request_body.user_id, text_len=len(request_body.text))
    raise HTTPException(
        status_code=501,
        detail="TTS provider not configured. Set SPEECH_PROVIDER in environment variables.",
    )
