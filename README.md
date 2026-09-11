# Gymsense-Ai-2
# GymSense AI — Computer Vision Workout Coach Prototype

## What this prototype proves

This is a browser-based MVP for the GymSense AI concept discussed earlier:

1. Opens the user's camera.
2. Detects a person's body pose using MoveNet.
3. Draws body landmarks over the live video.
4. Calculates joint/body angles.
5. Detects basic exercise phases.
6. Counts repetitions.
7. Produces simple real-time form feedback.
8. Shows a basic form score.

### Supported exercises

- Squat
- Push-up
- Bicep curl

## Tech stack

- HTML/CSS/JavaScript
- TensorFlow.js
- MoveNet pose estimation
- Browser MediaDevices camera API

No backend is required for this prototype.

## How to run

Because browsers restrict camera access on normal local files, run a local web server.

### Option 1 — Python

```bash
cd gymsense_ai_prototype
python3 -m http.server 8000
```

Then open:

http://localhost:8000

### Option 2 — VS Code

Install the "Live Server" extension and open `index.html` with Live Server.

## Recommended camera setup

For the first prototype test:

- Place the phone/laptop 2–3 meters away.
- Keep the complete body visible.
- Use good lighting.
- Avoid heavy occlusion.
- Start with a side-facing view for squats, push-ups and curls.
- Keep the camera approximately at waist/chest height where possible.

## Current limitations

This is deliberately an MVP, not a production fitness coach.

- It uses simple angle thresholds rather than a trained exercise-specific classifier.
- It mainly analyzes one side of the body.
- It does not yet personalize thresholds to body proportions.
- It does not handle all camera angles robustly.
- It does not identify every possible form mistake.
- Rep counting can fail when landmarks are occluded.
- The score is a prototype heuristic, not a scientifically validated fitness score.
- CDN dependencies require internet access.

## Production architecture after MVP validation

A stronger production version can evolve into:

Camera
→ Pose estimation
→ Landmark normalization
→ Exercise classifier
→ Rep/state machine
→ Form-error detection
→ Personalized feedback
→ Workout/session database
→ Progress analytics

Potential production components:

- MediaPipe Pose Landmarker or a stronger on-device pose model
- React/React Native or Flutter frontend
- FastAPI/Java/Spring Boot backend where server processing is required
- PostgreSQL
- Redis for short-lived session state
- Object storage only when users explicitly opt into recording
- Model monitoring and evaluation pipeline

## Important product principle

For the first validation, do NOT try to support every gym exercise.

Start with 3–5 exercises where pose landmarks can provide clear signals, validate:

- rep-count accuracy
- form-feedback accuracy
- latency
- camera robustness
- user experience

Then expand the exercise library.
