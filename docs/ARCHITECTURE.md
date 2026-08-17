# GymSense production architecture

## Current production-style V1

Browser camera -> MoveNet pose inference -> ExerciseEngine -> live UI
                                      |
                                      +-> workout summary -> FastAPI -> PostgreSQL

The browser performs live inference because this keeps the camera frames local and minimizes round-trip latency. Only workout summaries are sent to the backend in this V1.

## Ultimate architecture

Client (Web / iOS / Android)
  -> Camera abstraction
  -> On-device pose model
  -> Landmark normalization + temporal buffer
  -> Exercise classifier
  -> Form-quality model
  -> Rep/phase state machine
  -> Coaching policy
  -> Local UX
  -> API gateway
  -> Auth service
  -> Workout service
  -> Analytics/event service
  -> PostgreSQL
  -> Redis
  -> Object storage (optional consented video/debug samples)
  -> Queue
  -> Model registry / evaluation pipeline
  -> Observability stack

### Privacy principle
Raw camera frames should remain on-device by default. Uploading video or pose sequences should be an explicit opt-in feature with retention controls.

### Model lifecycle
1. Collect consented data.
2. Label exercise/phase/form errors.
3. Split by person, not by frame, to prevent leakage.
4. Train candidate model.
5. Evaluate offline.
6. Compare against current production model.
7. Register candidate.
8. Canary release.
9. Monitor quality and latency.
10. Roll back if thresholds fail.
