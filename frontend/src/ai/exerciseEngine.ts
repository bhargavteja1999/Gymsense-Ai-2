import { angle, keypoint } from './geometry'
import type { CoachingResult, Exercise, Point } from '../types'

type Side = 'left' | 'right'

export class ExerciseEngine {
  private phase = 'UNKNOWN'
  private stage: 'UP' | 'DOWN' | 'MID' = 'UP'
  private reps = 0
  private scoreSamples: number[] = []

  reset() {
    this.phase = 'UNKNOWN'
    this.stage = 'UP'
    this.reps = 0
    this.scoreSamples = []
  }

  getReps() {
    return this.reps
  }

  process(pose: any, exercise: Exercise): CoachingResult {
    if (exercise === 'squat') return this.squat(pose)
    if (exercise === 'pushup') return this.pushup(pose)
    return this.curl(pose)
  }

  private finish(score: number, angleValue: number | null, feedback: string, confidence: number): CoachingResult {
    const validScore = Number.isFinite(score) ? score : 0
    const safeScore = Math.max(0, Math.min(100, Math.round(validScore)))
    this.scoreSamples.push(safeScore)
    if (this.scoreSamples.length > 20) this.scoreSamples.shift()

    const avg = this.scoreSamples.length
      ? Math.round(this.scoreSamples.reduce((a, b) => a + b, 0) / this.scoreSamples.length)
      : 0

    return {
      phase: this.phase,
      repCompleted: false,
      score: avg,
      angle: angleValue !== null && Number.isFinite(angleValue) ? angleValue : null,
      feedback,
      confidence: Number.isFinite(confidence) ? confidence : 0,
      engine: 'landmark-rules',
      engineVersion: '0.2.0',
    }
  }

  private getSideKeypoints(pose: any, parts: string[]): { side: Side; points: Record<string, Point | null>; avgScore: number } {
    let leftScore = 0
    let rightScore = 0
    const leftPoints: Record<string, Point | null> = {}
    const rightPoints: Record<string, Point | null> = {}

    for (const part of parts) {
      const lp = keypoint(pose, `left_${part}`)
      const rp = keypoint(pose, `right_${part}`)
      leftPoints[part] = lp
      rightPoints[part] = rp
      if (lp) leftScore += lp.score
      if (rp) rightScore += rp.score
    }

    const useRight = rightScore > leftScore
    const chosenSide: Side = useRight ? 'right' : 'left'
    const chosenPoints = useRight ? rightPoints : leftPoints
    const avgScore = (useRight ? rightScore : leftScore) / Math.max(1, parts.length)

    return { side: chosenSide, points: chosenPoints, avgScore }
  }

  private squat(pose: any): CoachingResult {
    const { points, avgScore } = this.getSideKeypoints(pose, ['shoulder', 'hip', 'knee'])
    const shoulder = points.shoulder
    const hip = points.hip
    const knee = points.knee

    if (!shoulder || !hip || !knee) {
      return this.finish(0, null, 'Move into frame so your shoulder, hip and knee are visible.', 0.2)
    }

    // Angle of upper leg relative to vertical line from knee down
    const a = angle(hip, knee, { x: knee.x, y: knee.y + 100, score: 1, name: 'reference' })
    let score = 100
    let msg = 'Good squat mechanics.'

    if (a > 155) {
      this.phase = 'UP'
      if (this.stage === 'DOWN') {
        this.reps += 1
        this.stage = 'UP'
      }
    } else if (a < 105) {
      this.phase = 'DOWN'
      this.stage = 'DOWN'
    } else {
      this.phase = 'MID'
    }

    if (a > 120 && this.phase === 'DOWN') {
      score -= 20
      msg = 'Try to reach a deeper squat.'
    }

    return this.finish(score, a, msg, avgScore)
  }

  private pushup(pose: any): CoachingResult {
    const { points, avgScore } = this.getSideKeypoints(pose, ['shoulder', 'hip', 'ankle', 'elbow', 'wrist'])
    const shoulder = points.shoulder
    const hip = points.hip
    const ankle = points.ankle
    const elbow = points.elbow
    const wrist = points.wrist

    if (!shoulder || !hip || !ankle || !elbow || !wrist) {
      return this.finish(0, null, 'Show your full side profile to the camera.', 0.2)
    }

    const elbowAngle = angle(shoulder, elbow, wrist)
    const alignment = angle(shoulder, hip, ankle)

    let score = 100
    let msg = 'Good push-up position.'

    if (elbowAngle > 155) {
      this.phase = 'UP'
      if (this.stage === 'DOWN') {
        this.reps += 1
        this.stage = 'UP'
      }
    } else if (elbowAngle < 90) {
      this.phase = 'DOWN'
      this.stage = 'DOWN'
    } else {
      this.phase = 'MID'
    }

    if (alignment < 155) {
      score -= 25
      msg = 'Keep shoulders, hips and ankles aligned in a straight plank.'
    }

    return this.finish(score, elbowAngle, msg, avgScore)
  }

  private curl(pose: any): CoachingResult {
    const { points, avgScore } = this.getSideKeypoints(pose, ['shoulder', 'elbow', 'wrist'])
    const shoulder = points.shoulder
    const elbow = points.elbow
    const wrist = points.wrist

    if (!shoulder || !elbow || !wrist) {
      return this.finish(0, null, 'Show your arm clearly to the camera.', 0.2)
    }

    const a = angle(shoulder, elbow, wrist)
    let score = 100
    let msg = 'Good bicep curl form.'

    if (a > 150) {
      this.phase = 'DOWN'
      this.stage = 'DOWN'
    } else if (a < 55) {
      this.phase = 'UP'
      if (this.stage === 'DOWN') {
        this.reps += 1
        this.stage = 'UP'
      }
    } else {
      this.phase = 'MID'
    }

    const upperArmLength = Math.hypot(shoulder.x - elbow.x, shoulder.y - elbow.y)
    const shoulderElbowLateralShift = Math.abs(shoulder.x - elbow.x)
    if (shoulderElbowLateralShift > upperArmLength * 0.45) {
      score -= 20
      msg = 'Keep your upper arm stationary instead of swinging forward.'
    }

    return this.finish(score, a, msg, avgScore)
  }
}
