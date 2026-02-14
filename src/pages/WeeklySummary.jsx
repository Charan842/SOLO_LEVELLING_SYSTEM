import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertCircle, CalendarRange, Trophy, Zap } from 'lucide-react'
import { useGame } from '../context/GameContext'

function WeeklySummary() {
  const { weeklyPerformance } = useGame()

  const dailyRows = useMemo(() => {
    return weeklyPerformance?.daily || []
  }, [weeklyPerformance])

  const totals = useMemo(() => {
    const totalTasksCompleted = dailyRows.reduce((sum, row) => sum + (row.tasksCompleted || 0), 0)
    const weeklyXP = dailyRows.reduce((sum, row) => sum + (row.xpGained || 0), 0)
    const averageCompletion = Math.round(
      dailyRows.reduce((sum, row) => sum + (row.completionPercent || 0), 0) / Math.max(1, dailyRows.length)
    )
    const sorted = [...dailyRows].sort((a, b) => (a.completionPercent || 0) - (b.completionPercent || 0))
    return {
      totalTasksCompleted,
      weeklyXP,
      averageCompletion,
      bestDay: sorted[sorted.length - 1] || null,
      worstDay: sorted[0] || null,
    }
  }, [dailyRows])

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_28px_rgba(99,102,241,0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Weekly Performance</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">7-Day Battle Report</h2>
            <p className="text-sm text-slate-300">Track execution quality across the week.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs text-slate-300">
            <CalendarRange className="mr-2 inline h-4 w-4 text-cyan-300" />
            Weekly Window
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Tasks Completed</p>
            <p className="mt-2 text-2xl font-semibold text-white">{totals.totalTasksCompleted || 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Weekly XP</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-fuchsia-100">
              <Zap className="h-5 w-5 text-fuchsia-300" />
              {totals.weeklyXP || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Best Day</p>
            <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-emerald-100">
              <Trophy className="h-5 w-5 text-emerald-300" />
              {totals.bestDay?.label || '--'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Worst Day</p>
            <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-rose-100">
              <AlertCircle className="h-5 w-5 text-rose-300" />
              {totals.worstDay?.label || '--'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
          <h3 className="text-lg font-semibold text-white">Weekly Grade Trend</h3>
          <div className="mt-4 h-64">
            {dailyRows.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No weekly data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRows}>
                  <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} domain={[1, 5]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(2,6,23,0.92)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Line type="monotone" dataKey="gradeScore" stroke="#a855f7" strokeWidth={2.4} dot />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
          <h3 className="text-lg font-semibold text-white">Daily Completion %</h3>
          <div className="mt-4 h-64">
            {dailyRows.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Complete today&apos;s tasks to start this graph.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRows}>
                  <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(2,6,23,0.92)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Bar dataKey="completionPercent" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default WeeklySummary
