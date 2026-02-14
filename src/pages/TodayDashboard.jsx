import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Flame, Gem, ShieldCheck, Target } from 'lucide-react'
import { useGame } from '../context/GameContext'

const gradeStyle = {
  S: 'border-amber-300/50 bg-amber-300/15 text-amber-100',
  A: 'border-emerald-400/50 bg-emerald-400/15 text-emerald-100',
  B: 'border-cyan-400/50 bg-cyan-400/15 text-cyan-100',
  C: 'border-indigo-400/50 bg-indigo-400/15 text-indigo-100',
  F: 'border-rose-400/50 bg-rose-400/15 text-rose-100',
}

const completionCopy = (percent) => {
  const safe = Number(percent || 0)
  if (safe >= 100) return 'Perfect clear. Keep this standard.'
  if (safe >= 80) return 'Strong execution. Push for a full clear.'
  if (safe >= 60) return 'Momentum is building. Finish your pending tasks.'
  if (safe >= 40) return 'You are behind. Start with the easiest pending task now.'
  return 'Critical zone. Take immediate action to protect your streak.'
}

function TodayDashboard() {
  const { todaySummary, streak, longestStreak, settings, refreshDailySystems } = useGame()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => {
      setNow(new Date())
      refreshDailySystems()
    }

    tick()
    const timer = setInterval(tick, 60 * 1000)
    return () => clearInterval(timer)
  }, [refreshDailySystems])

  const habits = useMemo(
    () => (todaySummary?.tasks || []).filter((task) => task.type === 'habit'),
    [todaySummary]
  )
  const quests = useMemo(
    () => (todaySummary?.tasks || []).filter((task) => task.type === 'quest'),
    [todaySummary]
  )

  const safeSummary = todaySummary || {
    completionPercent: 0,
    grade: 'F',
    completedTasks: 0,
    totalTasks: 0,
    pendingTasks: 0,
    xpGained: 0,
    goldGained: 0,
    atRisk: false,
    warningMessage: '',
  }

  const gradeTone = gradeStyle[safeSummary.grade] || gradeStyle.F
  const shouldWarn = Boolean(settings?.streakWarnings && safeSummary.atRisk)

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_28px_rgba(56,189,248,0.22)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Today Dashboard</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Daily System Status</h2>
            <p className="mt-1 text-sm text-slate-300">{completionCopy(safeSummary.completionPercent)}</p>
          </div>
          <div className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${gradeTone}`}>
            Grade {safeSummary.grade}
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Completion</p>
            <p className="mt-2 text-2xl font-semibold text-white">{safeSummary.completionPercent}%</p>
            <p className="text-xs text-slate-400">
              {safeSummary.completedTasks}/{safeSummary.totalTasks} tasks
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Current Streak</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
              <Flame className="h-5 w-5 text-orange-300" />
              {streak}
            </p>
            <p className="text-xs text-slate-400">Longest {longestStreak}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">XP Today</p>
            <p className="mt-2 text-2xl font-semibold text-fuchsia-100">{safeSummary.xpGained}</p>
            <p className="text-xs text-slate-400">Net progress today</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Gold Today</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-amber-100">
              <Gem className="h-5 w-5 text-amber-300" />
              {safeSummary.goldGained}
            </p>
            <p className="text-xs text-slate-400">Earned from completed quests</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Pending</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
              <Target className="h-5 w-5 text-cyan-300" />
              {safeSummary.pendingTasks}
            </p>
            <p className="text-xs text-slate-400">{now.toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="mt-5 h-3 overflow-hidden rounded-full border border-white/10 bg-black/50">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-amber-300"
            initial={{ width: 0 }}
            animate={{ width: `${safeSummary.completionPercent}%` }}
            transition={{ duration: 0.35 }}
          />
        </div>

        {shouldWarn && (
          <div className="mt-5 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Streak Risk Indicator</p>
                <p>{safeSummary.warningMessage}</p>
              </div>
            </div>
          </div>
        )}

        {settings?.dailyGoalReminders && safeSummary.pendingTasks > 0 && (
          <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            Reminder: complete at least one pending task now to protect momentum.
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
          <h3 className="text-lg font-semibold text-white">Habits Today</h3>
          <div className="mt-3 space-y-2">
            {habits.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">{task.title}</span>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                    task.status === 'completed'
                      ? 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                      : 'border border-white/15 bg-white/5 text-slate-400'
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
          <h3 className="text-lg font-semibold text-white">Quests Today</h3>
          <div className="mt-3 space-y-2">
            {quests.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              >
                <span className="text-slate-200">{task.title}</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-fuchsia-100">
                    {task.difficulty}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                      task.status === 'completed'
                        ? 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                        : task.status === 'failed'
                          ? 'border border-rose-400/40 bg-rose-400/10 text-rose-100'
                          : 'border border-white/15 bg-white/5 text-slate-400'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          System note: grade updates live as tasks are completed.
        </div>
      </section>
    </div>
  )
}

export default TodayDashboard
