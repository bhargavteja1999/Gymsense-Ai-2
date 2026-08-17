import { describe, it, expect, beforeEach } from 'vitest'
import { ExerciseEngine } from '../exerciseEngine'

describe('ExerciseEngine', () => {
  let engine: ExerciseEngine

  beforeEach(() => {
    engine = new ExerciseEngine()
  })

  function createPose(keypointsMap: Record<string, { x: number; y: number; score?: number }>) {
    const keypoints = Object.entries(keypointsMap).map(([name, kp]) => ({
      name,
      x: kp.x,
      y: kp.y,
      score: kp.score ?? 0.9,
    }))
    return { keypoints }
  }

  it('counts squat reps through DOWN -> MID -> UP transitions', () => {
    // Standing up (straight leg)
    const standingPose = createPose({
      left_shoulder: { x: 100, y: 100 },
      left_hip: { x: 100, y: 200 },
      left_knee: { x: 100, y: 300 },
    })

    // Deep squat (knee bent, hip low)
    const squatPose = createPose({
      left_shoulder: { x: 100, y: 250 },
      left_hip: { x: 100, y: 300 },
      left_knee: { x: 180, y: 300 },
    })

    // Standing (phase UP)
    let res = engine.process(standingPose, 'squat')
    expect(res.phase).toBe('UP')
    expect(engine.getReps()).toBe(0)

    // Squatting down (phase DOWN)
    res = engine.process(squatPose, 'squat')
    expect(res.phase).toBe('DOWN')

    // Mid way up (phase MID)
    const midPose = createPose({
      left_shoulder: { x: 100, y: 150 },
      left_hip: { x: 100, y: 220 },
      left_knee: { x: 140, y: 300 },
    })
    res = engine.process(midPose, 'squat')
    expect(res.phase).toBe('MID')
    expect(engine.getReps()).toBe(0)

    // Back to standing (phase UP) -> Rep should complete!
    res = engine.process(standingPose, 'squat')
    expect(res.phase).toBe('UP')
    expect(engine.getReps()).toBe(1)
  })

  it('auto-detects right side when left side is missing', () => {
    const rightSidePose = createPose({
      right_shoulder: { x: 100, y: 100 },
      right_hip: { x: 100, y: 200 },
      right_knee: { x: 100, y: 300 },
    })

    const res = engine.process(rightSidePose, 'squat')
    expect(res.feedback).not.toContain('Move into frame so your shoulder, hip and knee are visible.')
    expect(res.confidence).toBeGreaterThan(0.5)
  })

  it('handles missing pushup wrist keypoints safely', () => {
    const incompletePose = createPose({
      left_shoulder: { x: 100, y: 100 },
      left_hip: { x: 100, y: 200 },
      left_ankle: { x: 100, y: 300 },
      left_elbow: { x: 120, y: 150 },
      // left_wrist missing!
    })

    const res = engine.process(incompletePose, 'pushup')
    expect(res.feedback).toContain('Show your full side profile to the camera.')
    expect(res.score).toBe(0)
  })
})
