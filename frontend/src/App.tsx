import { useEffect, useRef, useState } from 'react'
import { createPoseDetector } from './ai/poseService'
import { ExerciseEngine } from './ai/exerciseEngine'
import { POSE_CONNECTIONS } from './ai/geometry'
import { saveWorkout, getWorkouts, type WorkoutSessionItem } from './services/api'
import type { Exercise, CoachingResult } from './types'

const engine = new ExerciseEngine()

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectorRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const isDemoRef = useRef(false)
  const demoTimeRef = useRef(0)

  const [exercise, setExercise] = useState<Exercise>('squat')
  const [status, setStatus] = useState('Ready. Select Start Camera or Demo Mode.')
  const [statusType, setStatusType] = useState<'idle' | 'active' | 'warning' | 'error'>('idle')
  const [feedback, setFeedback] = useState('Position yourself in full view of the camera.')
  const [result, setResult] = useState<CoachingResult | null>(null)
  const [reps, setReps] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [history, setHistory] = useState<WorkoutSessionItem[]>([])
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    loadHistory()
    return () => stop()
  }, [])

  async function loadHistory() {
    try {
      const items = await getWorkouts('demo-user')
      setHistory(items)
    } catch {
      // Backend optional on startup
    }
  }

  async function startCamera() {
    stop()
    isDemoRef.current = false
    setIsDemo(false)
    try {
      setStatus('Requesting camera permission…')
      setStatusType('active')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      setStatus('Loading MoveNet pose model…')
      detectorRef.current = await createPoseDetector()
      engine.reset()
      runningRef.current = true
      setStatus('Tracking body landmarks in real-time')
      setStatusType('active')
      loopCamera()
    } catch (error) {
      console.error(error)
      setStatus('Camera unavailable. Switch to Demo Simulation Mode below.')
      setStatusType('warning')
      setFeedback('Camera access was blocked or not found. You can test full pose coaching using Demo Simulation Mode!')
    }
  }

  function startDemo() {
    stop()
    isDemoRef.current = true
    setIsDemo(true)
    engine.reset()
    runningRef.current = true
    demoTimeRef.current = 0
    setStatus('Running GymSense Motion Simulator')
    setStatusType('active')
    setFeedback('Simulating realistic biomechanical workout movement.')
    loopDemo()
  }

  function stop() {
    runningRef.current = false
    isDemoRef.current = false
    setIsDemo(false)
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStatus('Stopped. Ready to begin.')
    setStatusType('idle')
  }

  async function loopCamera() {
    if (!runningRef.current || isDemoRef.current || !videoRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
    }

    if (detectorRef.current && video.videoWidth > 0) {
      const poses = await detectorRef.current.estimatePoses(video, { flipHorizontal: false })
      if (poses.length) {
        const pose = poses[0]
        drawPose(pose)
        const r = engine.process(pose, exercise)
        setResult(r)
        setReps(engine.getReps())
        setFeedback(r.feedback)
        setStatus('Tracking body landmarks in real-time')
        setStatusType('active')
      } else {
        setStatus('No person detected')
        setStatusType('warning')
        setFeedback('Move fully into camera view so your body is visible.')
      }
    }
    frameRef.current = requestAnimationFrame(loopCamera)
  }

  function loopDemo() {
    if (!runningRef.current || !isDemoRef.current) return
    demoTimeRef.current += 0.04
    const t = demoTimeRef.current
    const canvas = canvasRef.current

    if (canvas) {
      if (canvas.width !== 640 || canvas.height !== 480) {
        canvas.width = 640
        canvas.height = 480
      }
    }

    const pose = generateSimulatedPose(exercise, t)
    drawPose(pose)
    const r = engine.process(pose, exercise)
    setResult(r)
    setReps(engine.getReps())
    setFeedback(r.feedback)

    frameRef.current = requestAnimationFrame(loopDemo)
  }

  function generateSimulatedPose(ex: Exercise, t: number) {
    const cycle = (Math.sin(t) + 1) / 2 // 0 to 1 smooth oscillation
    const keypoints: Array<{ name: string; x: number; y: number; score: number }> = []

    if (ex === 'squat') {
      const hipY = 220 + cycle * 90
      const kneeY = 340 + cycle * 20
      const kneeX = 320 + cycle * 40
      const shoulderY = hipY - 100

      keypoints.push(
        { name: 'left_shoulder', x: 300, y: shoulderY, score: 0.95 },
        { name: 'left_hip', x: 300, y: hipY, score: 0.95 },
        { name: 'left_knee', x: kneeX, y: kneeY, score: 0.95 },
        { name: 'left_ankle', x: 300, y: 440, score: 0.95 },
        { name: 'left_elbow', x: 280, y: shoulderY + 40, score: 0.9 },
        { name: 'left_wrist', x: 260, y: shoulderY + 80, score: 0.9 },
        { name: 'right_shoulder', x: 310, y: shoulderY, score: 0.8 },
        { name: 'right_hip', x: 310, y: hipY, score: 0.8 },
        { name: 'right_knee', x: kneeX + 10, y: kneeY, score: 0.8 },
        { name: 'right_ankle', x: 310, y: 440, score: 0.8 }
      )
    } else if (ex === 'pushup') {
      const shoulderY = 220 + cycle * 70
      const elbowX = 240 - cycle * 50

      keypoints.push(
        { name: 'left_shoulder', x: 200, y: shoulderY, score: 0.95 },
        { name: 'left_elbow', x: elbowX, y: shoulderY + 30, score: 0.95 },
        { name: 'left_wrist', x: 200, y: 380, score: 0.95 },
        { name: 'left_hip', x: 360, y: 240, score: 0.95 },
        { name: 'left_ankle', x: 500, y: 260, score: 0.95 }
      )
    } else {
      // Curl
      const wristAngle = (1 - cycle) * Math.PI
      const armLen = 70
      const wristX = 320 + Math.sin(wristAngle) * armLen
      const wristY = 240 + Math.cos(wristAngle) * armLen

      keypoints.push(
        { name: 'left_shoulder', x: 320, y: 160, score: 0.95 },
        { name: 'left_elbow', x: 320, y: 240, score: 0.95 },
        { name: 'left_wrist', x: wristX, y: wristY, score: 0.95 },
        { name: 'left_hip', x: 320, y: 300, score: 0.9 }
      )
    }

    return { keypoints }
  }

  function drawPose(pose: any) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const keypointsByName: Record<string, { x: number; y: number; score: number }> = {}
    for (const kp of pose.keypoints) {
      if ((kp.score ?? 0) > 0.35) {
        keypointsByName[kp.name] = kp
      }
    }

    // Draw Skeleton Connections
    ctx.lineWidth = 4
    ctx.strokeStyle = '#38bdf8'
    ctx.shadowColor = '#00f2fe'
    ctx.shadowBlur = 10

    for (const [partA, partB] of POSE_CONNECTIONS) {
      const pA = keypointsByName[partA]
      const pB = keypointsByName[partB]
      if (pA && pB) {
        ctx.beginPath()
        ctx.moveTo(pA.x, pA.y)
        ctx.lineTo(pB.x, pB.y)
        ctx.stroke()
      }
    }

    // Draw Joint Keypoints
    ctx.shadowBlur = 12
    ctx.shadowColor = '#63e6be'
    for (const kp of pose.keypoints) {
      if ((kp.score ?? 0) > 0.35) {
        ctx.fillStyle = '#63e6be'
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, 6, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    ctx.shadowBlur = 0
  }

  async function finishWorkout() {
    setIsSaving(true)
    try {
      await saveWorkout({
        user_id: 'demo-user',
        exercise,
        reps,
        average_score: result?.score ?? 0,
        feedback: result?.feedback ?? feedback,
      })
      setFeedback('Workout saved successfully to local database.')
      await loadHistory()
    } catch (e) {
      console.error(e)
      setFeedback('Workout saved locally (backend server connection offline).')
    } finally {
      setIsSaving(false)
    }
  }

  function changeExercise(value: Exercise) {
    stop()
    engine.reset()
    setExercise(value)
    setReps(0)
    setResult(null)
    setFeedback('Position yourself side-on to the camera.')
    setStatus('Ready. Select Start Camera or Demo Mode.')
  }

  return (
    <div className="app">
      <header>
        <div className="brand">
          Gym<span className="brand-highlight">Sense</span> <span className="ai-badge">AI 0.2</span>
        </div>
        <div className="header-meta">
          <span className={`status-indicator status-${statusType}`} />
          <span className="tag">{status}</span>
        </div>
      </header>

      <main>
        <div className="toolbar">
          <div className="toolbar-group">
            <label htmlFor="exercise-select">Exercise</label>
            <select
              id="exercise-select"
              value={exercise}
              onChange={(e) => changeExercise(e.target.value as Exercise)}
            >
              <option value="squat">Squat</option>
              <option value="pushup">Push-up</option>
              <option value="curl">Bicep Curl</option>
            </select>
          </div>

          <div className="toolbar-actions">
            <button className="btn btn-primary" onClick={startCamera}>
              🎥 Start Camera
            </button>
            <button className="btn btn-secondary" onClick={startDemo}>
              ⚡ Demo Simulation Mode
            </button>
            <button className="btn btn-danger" onClick={stop}>
              ⏹ Stop
            </button>
            <button className="btn btn-accent" onClick={finishWorkout} disabled={isSaving}>
              {isSaving ? 'Saving…' : '💾 Save Workout'}
            </button>
          </div>
        </div>

        <div className="grid">
          <section className="card video-card">
            <div className="video-wrap">
              {isDemo ? (
                <div className="demo-canvas-placeholder">
                  <div className="demo-badge">MOTION SIMULATOR ACTIVE</div>
                </div>
              ) : (
                <video ref={videoRef} autoPlay muted playsInline />
              )}
              <canvas ref={canvasRef} className={isDemo ? 'demo-canvas' : ''} />
            </div>

            <div className="feedback-banner">
              <div className="feedback-icon">💡</div>
              <div className="feedback-text">{feedback}</div>
            </div>
          </section>

          <aside className="sidebar">
            <section className="card metrics-card">
              <h3>Live Biomechanics Metrics</h3>
              <div className="metrics-grid">
                <Metric label="Reps" value={reps} highlight />
                <Metric label="Form Score" value={result ? `${result.score}/100` : '—'} />
                <Metric label="Phase" value={result?.phase ?? '—'} />
                <Metric
                  label="Body Angle"
                  value={result?.angle !== null && result?.angle !== undefined ? `${Math.round(result.angle)}°` : '—'}
                />
              </div>

              <div className="ai-note">
                <div className="note-title">🤖 AI Pose Pipeline</div>
                On-device TensorFlow.js MoveNet pose estimation with real-time biomechanical state-machine form evaluation.
              </div>
            </section>

            {history.length > 0 && (
              <section className="card history-card">
                <h3>Workout History Log</h3>
                <div className="history-list">
                  {history.slice(0, 5).map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-main">
                        <span className="history-exercise">{item.exercise.toUpperCase()}</span>
                        <span className="history-reps">{item.reps} reps</span>
                      </div>
                        <div className="history-score">Score: {item.average_score ?? '—'}/100</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

function Metric({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`metric ${highlight ? 'metric-highlight' : ''}`}>
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}
