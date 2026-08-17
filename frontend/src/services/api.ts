import type { Exercise } from '../types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export interface WorkoutSessionItem {
  id: number
  user_id: string
  exercise: Exercise
  reps: number
  average_score: number | null
  feedback: string | null
  started_at: string
}

export async function saveWorkout(payload: {
  user_id: string
  exercise: Exercise
  reps: number
  average_score: number
  feedback: string
}): Promise<WorkoutSessionItem> {
  const response = await fetch(`${API_BASE}/api/v1/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`Workout save failed: ${response.status}`)
  return response.json()
}

export async function getWorkouts(userId: string): Promise<WorkoutSessionItem[]> {
  const response = await fetch(`${API_BASE}/api/v1/workouts/${userId}`)
  if (!response.ok) throw new Error(`Workout history fetch failed: ${response.status}`)
  return response.json()
}
