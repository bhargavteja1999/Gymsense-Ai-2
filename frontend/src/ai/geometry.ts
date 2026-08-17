import type { Point } from '../types'

export function angle(a: Point, b: Point, c: Point): number {
  const ab = { x: a.x - b.x, y: a.y - b.y }
  const cb = { x: c.x - b.x, y: c.y - b.y }
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y)
  if (!mag) return 0
  const cosine = Math.max(-1, Math.min(1, (ab.x * cb.x + ab.y * cb.y) / mag))
  return (Math.acos(cosine) * 180) / Math.PI
}

export function keypoint(pose: any, name: string, threshold = 0.35): Point | null {
  if (!pose?.keypoints || !Array.isArray(pose.keypoints)) return null
  const kp = pose.keypoints.find((k: any) => k.name === name && (k.score ?? 1) >= threshold)
  return kp ? { x: kp.x, y: kp.y, score: kp.score ?? 1, name: kp.name } : null
}

export const POSE_CONNECTIONS: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
]
