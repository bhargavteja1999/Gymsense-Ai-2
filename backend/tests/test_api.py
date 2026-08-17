import os
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_create_and_read_workout():
    payload = {"user_id": "demo", "exercise": "squat", "reps": 10, "average_score": 88, "feedback": "Good depth"}
    response = client.post("/api/v1/workouts", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["reps"] == 10

    response = client.get("/api/v1/workouts/demo")
    assert response.status_code == 200
    assert response.json()[0]["exercise"] == "squat"
