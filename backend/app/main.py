import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.db import Base, engine
from app.api import health, workouts, ai

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("gymsense")

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.app_name, version=settings.app_version)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(workouts.router)
app.include_router(ai.router)


@app.get("/")
def root():
    return {"service": settings.app_name, "version": settings.app_version}
