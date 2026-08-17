from pydantic import BaseModel, Field


class PosePoint(BaseModel):
    name: str
    x: float
    y: float
    score: float = Field(ge=0, le=1)


class AnalyzeRequest(BaseModel):
    exercise: str
    keypoints: list[PosePoint]


class AnalyzeResponse(BaseModel):
    exercise: str
    phase: str
    rep_completed: bool
    score: int
    angle: float | None
    feedback: str
    confidence: float
    engine: str
    engine_version: str
