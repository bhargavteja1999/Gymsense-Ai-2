from datetime import datetime
from pydantic import BaseModel, Field, field_validator


EXERCISES = {"squat", "pushup", "curl"}


class WorkoutCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=128)
    exercise: str
    reps: int = Field(ge=0)
    average_score: int | None = Field(default=None, ge=0, le=100)
    feedback: str | None = Field(default=None, max_length=500)

    @field_validator("exercise")
    @classmethod
    def validate_exercise(cls, value: str) -> str:
        if value not in EXERCISES:
            raise ValueError(f"Unsupported exercise. Must be one of: {sorted(EXERCISES)}")
        return value


class WorkoutOut(BaseModel):
    id: int
    user_id: str
    exercise: str
    reps: int
    average_score: int | None
    feedback: str | None
    started_at: datetime

    model_config = {"from_attributes": True}
