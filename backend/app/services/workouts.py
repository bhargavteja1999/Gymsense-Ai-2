from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.workout import WorkoutSession
from app.schemas.workout import WorkoutCreate


def create_workout(db: Session, payload: WorkoutCreate) -> WorkoutSession:
    if payload.exercise not in {"squat", "pushup", "curl"}:
        raise ValueError("Unsupported exercise")
    item = WorkoutSession(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_workouts(db: Session, user_id: str) -> list[WorkoutSession]:
    return list(db.scalars(select(WorkoutSession).where(WorkoutSession.user_id == user_id).order_by(WorkoutSession.id.desc())).all())
