from fastapi import APIRouter
from app.schemas.ai import AnalyzeRequest, AnalyzeResponse

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    # Intentionally NOT used by the browser's real-time loop in this V1.
    # It is a contract for future server-side inference and offline evaluation.
    return AnalyzeResponse(
        exercise=payload.exercise,
        phase="UNKNOWN",
        rep_completed=False,
        score=0,
        angle=None,
        feedback="Server-side inference is not enabled in this V1; browser inference is authoritative for live coaching.",
        confidence=0.0,
        engine="placeholder",
        engine_version="0.1.0",
    )
