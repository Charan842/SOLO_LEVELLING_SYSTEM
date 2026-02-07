import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useGame } from '../context/GameContext'
import { setLastAction } from '../utils/actionLog'

const MODES = [
  { id: 'focus', label: 'Pomodoro', seconds: 50 * 60, xpReward: 40 },
  { id: 'short', label: 'Short Break', seconds: 10 * 60, xpReward: 0 },
  { id: 'long', label: 'Long Break', seconds: 20 * 60, xpReward: 0 },
]

const formatTime = (value) => {
  const minutes = Math.floor(value / 60)
  const seconds = value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function PomodoroTimer() {
  const { addXP } = useGame()
  const [modeId, setModeId] = useState('focus')
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].seconds)
  const [isRunning, setIsRunning] = useState(false)

  const mode = useMemo(() => MODES.find((entry) => entry.id === modeId), [modeId])

  useEffect(() => {
    if (!isRunning) return
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [isRunning])

  useEffect(() => {
    if (secondsLeft !== 0) return
    setIsRunning(false)
    if (mode?.xpReward) {
      const dateKey = new Date().toISOString().slice(0, 10)
      addXP(mode.xpReward, {
        trackHistory: true,
        dateKey,
      })
      setLastAction({
        type: 'xp_gain',
        amount: mode.xpReward,
        source: 'pomodoro',
      })
    }
  }, [secondsLeft, mode, addXP])

  useEffect(() => {
    setSecondsLeft(mode?.seconds ?? MODES[0].seconds)
    setIsRunning(false)
  }, [modeId])

  const progress = mode ? 1 - secondsLeft / mode.seconds : 0
  const circumference = 2 * Math.PI * 54
  const offset = circumference - progress * circumference

  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_35px_rgba(139,92,246,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Focus Gate</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Pomodoro Timer</h3>
          <p className="text-sm text-slate-300">
            Focus clears grant XP. Breaks restore stamina.
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Reward: <span className="text-fuchsia-200">{mode?.xpReward || 0} XP</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {MODES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setModeId(entry.id)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
              entry.id === modeId
                ? 'border-fuchsia-400/60 bg-fuchsia-400/10 text-fuchsia-100'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/30'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <svg viewBox="0 0 140 140" className="absolute inset-0">
            <circle
              cx="70"
              cy="70"
              r="54"
              stroke="rgba(148,163,184,0.2)"
              strokeWidth="10"
              fill="none"
            />
            <motion.circle
              cx="70"
              cy="70"
              r="54"
              stroke="url(#focusGradient)"
              strokeWidth="10"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.6 }}
            />
            <defs>
              <linearGradient id="focusGradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-3xl font-semibold text-white">
            {formatTime(secondsLeft)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRunning((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/20"
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            type="button"
            onClick={() => setSecondsLeft(mode?.seconds ?? MODES[0].seconds)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/30"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default PomodoroTimer
