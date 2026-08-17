from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.workout import WorkoutCreate, WorkoutOut
from app.services.workouts import create_workout, list_workouts

router = APIRouter(prefix="/api/v1/workouts", tags=["workouts"])


@router.post("", response_model=WorkoutOut, status_code=201)
def create(payload: WorkoutCreate, db: Session = Depends(get_db)):
    try:
        return create_workout(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{user_id}", response_model=list[WorkoutOut])
def history(user_id: str, db: Session = Depends(get_db)):
    return list_workouts(db, user_id)
