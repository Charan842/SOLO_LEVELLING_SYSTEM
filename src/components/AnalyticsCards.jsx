import { CheckCircle2, Target, TrendingDown, TrendingUp, XCircle } from 'lucide-react'

const formatCount = (value) => {
  const safe = Number(value)
  if (!Number.isFinite(safe)) return '0'
  return Math.max(0, Math.floor(safe)).toLocaleString('en-US')
}

const clampPercent = (value) => {
  const safe = Number(value)
  if (!Number.isFinite(safe)) return 0
  return Math.max(0, Math.min(100, Math.round(safe)))
}

function ProgressRow({ label, value, color = 'cyan' }) {
  const safe = clampPercent(value)
  const barClass =
    color === 'green'
      ? 'bg-emerald-400/70'
      : color === 'red'
      ? 'bg-rose-400/70'
      : color === 'amber'
      ? 'bg-amber-400/70'
      : 'bg-cyan-400/70'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>{label}</span>
        <span>{safe}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800/80">
        <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${safe}%` }} />
      </div>
    </div>
  )
}

function StatMini({ label, value, tone = 'default', icon: Icon }) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-200 border-emerald-400/30 bg-emerald-400/10'
      : tone === 'bad'
      ? 'text-rose-200 border-rose-400/30 bg-rose-400/10'
      : 'text-slate-200 border-white/10 bg-white/5'

  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.22em]">{label}</p>
        {Icon ? <Icon className="h-3.5 w-3.5 opacity-90" /> : null}
      </div>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}

function AnalyticsCards({ habits, quests }) {
  const habitToday = habits?.today || { total: 0, completed: 0, missed: 0, completionPercent: 0 }
  const habitWeek = habits?.week || {
    completed: 0,
    missed: 0,
    bestStreak: 0,
    currentStreak: 0,
    completionPercent: 0,
  }
  const habitMonth = habits?.month || {
    totalHabitDays: 0,
    missedDays: 0,
    consistencyPercent: 0,
  }

  const questToday = quests?.today || { completed: 0, failed: 0, completionPercent: 0 }
  const questWeek = quests?.week || {
    completed: 0,
    failed: 0,
    completionPercent: 0,
    byDifficulty: { Easy: 0, Normal: 0, Hard: 0 },
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_26px_rgba(16,185,129,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Habit Analytics</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Consistency Signals</h3>
          </div>
          <Target className="h-5 w-5 text-emerald-300" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <StatMini
            label="Today Total"
            value={formatCount(habitToday.total)}
            icon={Target}
          />
          <StatMini
            label="Today Completed"
            value={formatCount(habitToday.completed)}
            tone="good"
            icon={CheckCircle2}
          />
          <StatMini
            label="Today Missed"
            value={formatCount(habitToday.missed)}
            tone="bad"
            icon={XCircle}
          />
          <StatMini
            label="Today Completion"
            value={`${clampPercent(habitToday.completionPercent)}%`}
            icon={TrendingUp}
          />
        </div>

        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/45 p-4">
          <ProgressRow
            label="Weekly Habit Completion"
            value={habitWeek.completionPercent}
            color="green"
          />
          <ProgressRow
            label="Monthly Consistency"
            value={habitMonth.consistencyPercent}
            color="cyan"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <StatMini
            label="Week Done"
            value={formatCount(habitWeek.completed)}
            tone="good"
            icon={CheckCircle2}
          />
          <StatMini
            label="Week Missed"
            value={formatCount(habitWeek.missed)}
            tone="bad"
            icon={TrendingDown}
          />
          <StatMini
            label="Best Streak"
            value={formatCount(habitWeek.bestStreak)}
            icon={TrendingUp}
          />
          <StatMini
            label="Current Streak"
            value={formatCount(habitWeek.currentStreak)}
            icon={TrendingUp}
          />
          <StatMini
            label="Habit Days (30D)"
            value={formatCount(habitMonth.totalHabitDays)}
            icon={Target}
          />
          <StatMini
            label="Missed Days (30D)"
            value={formatCount(habitMonth.missedDays)}
            tone="bad"
            icon={XCircle}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_26px_rgba(217,70,239,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Quest Analytics</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Execution Quality</h3>
          </div>
          <Target className="h-5 w-5 text-fuchsia-300" />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <StatMini
            label="Today Completed"
            value={formatCount(questToday.completed)}
            tone="good"
            icon={CheckCircle2}
          />
          <StatMini
            label="Today Failed"
            value={formatCount(questToday.failed)}
            tone="bad"
            icon={XCircle}
          />
          <StatMini
            label="Week Completed"
            value={formatCount(questWeek.completed)}
            tone="good"
            icon={CheckCircle2}
          />
          <StatMini
            label="Week Failed"
            value={formatCount(questWeek.failed)}
            tone="bad"
            icon={XCircle}
          />
        </div>

        <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/45 p-4">
          <ProgressRow
            label="Quest Completion Rate"
            value={questWeek.completionPercent}
            color="amber"
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatMini
            label="Easy Complete"
            value={formatCount(questWeek.byDifficulty?.Easy || 0)}
            tone="good"
          />
          <StatMini
            label="Normal Complete"
            value={formatCount(questWeek.byDifficulty?.Normal || 0)}
          />
          <StatMini
            label="Hard Complete"
            value={formatCount(questWeek.byDifficulty?.Hard || 0)}
          />
        </div>
      </div>
    </section>
  )
}

export default AnalyticsCards

