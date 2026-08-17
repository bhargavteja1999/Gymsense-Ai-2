export type Exercise = 'squat' | 'pushup' | 'curl'

export interface Point { x: number; y: number; score: number; name: string }

export interface CoachingResult {
  phase: string
  repCompleted: boolean
  score: number
  angle: number | null
  feedback: string
  confidence: number
  engine: string
  engineVersion: string
}
