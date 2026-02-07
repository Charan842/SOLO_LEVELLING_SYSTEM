import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CalendarClock,
  Flame,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AnalyticsCards from '../components/AnalyticsCards'
import ProfileStats from '../components/ProfileStats'
import SettingsPanel from '../components/SettingsPanel'
import { useGame } from '../context/GameContext'
import { buildProfileAnalytics } from '../utils/analytics'
import { readStorage } from '../utils/storage'

const QUESTS_KEY = 'solo_leveling_quests_v1'
const HABITS_KEY = 'solo_leveling_habits_v1'
const REWARD_LOG_KEY = 'solo_leveling_reward_log_v1'

const readSnapshot = () => ({
  quests: readStorage(QUESTS_KEY, []),
  habits: readStorage(HABITS_KEY, []),
  rewardLog: readStorage(REWARD_LOG_KEY, []),
})

const formatHistoryDate = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return dateKey
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function Profile() {
  const {
    level,
    rank,
    streak,
    longestStreak,
    daysMissedTotal,
    perfectDaysCount,
    totalXPEarned,
    firstUseAt,
    dailyHistory,
    profile,
    settings,
    updateProfile,
    updateSettings,
    resetStreak,
    resetAllData,
  } = useGame()

  const [snapshot, setSnapshot] = useState(readSnapshot)
  const [trendWindow, setTrendWindow] = useState('7d')

  useEffect(() => {
    const refresh = () => {
      setSnapshot(readSnapshot())
    }
    refresh()
    const timer = setInterval(refresh, 20 * 1000)
    return () => clearInterval(timer)
  }, [])

  const analytics = useMemo(
    () =>
      buildProfileAnalytics({
        state: { firstUseAt, dailyHistory },
        quests: snapshot.quests,
        habits: snapshot.habits,
        rewardLog: snapshot.rewardLog,
      }),
    [firstUseAt, dailyHistory, snapshot]
  )

  const discipline = useMemo(
    () => ({
      currentStreak: Math.max(analytics.discipline.currentStreak, streak),
      longestStreak: Math.max(analytics.discipline.longestStreak, longestStreak),
      daysMissedTotal: Math.max(analytics.discipline.daysMissedTotal, daysMissedTotal),
      perfectDaysCount: Math.max(analytics.discipline.perfectDaysCount, perfectDaysCount),
      atRisk: analytics.discipline.atRisk,
    }),
    [analytics.discipline, streak, longestStreak, daysMissedTotal, perfectDaysCount]
  )

  const trendData = trendWindow === '30d' ? analytics.trends.thirtyDay : analytics.trends.sevenDay
  const historyRows = analytics.history.slice(0, 45)

  return (
    <div className="space-y-6">
      <ProfileStats
        playerName={profile.playerName}
        title={profile.title}
        level={level}
        rank={rank}
        totalXPEarned={totalXPEarned}
        accountAgeDays={analytics.identity.accountAgeDays}
        onUpdateProfile={updateProfile}
      />

      <AnalyticsCards habits={analytics.habits} quests={analytics.quests} />

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_28px_rgba(251,113,133,0.22)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
              Discipline Matrix
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">Streak & Integrity</h3>
          </div>
          {discipline.atRisk ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100">
              <AlertTriangle className="h-3.5 w-3.5" />
              Streak at risk
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Stable
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-white/10 bg-black/45 p-4"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Current</p>
            <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
              <Flame className="h-6 w-6 text-orange-300" />
              {discipline.currentStreak}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-white/10 bg-black/45 p-4"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Longest</p>
            <p className="mt-2 text-2xl font-semibold text-white">{discipline.longestStreak}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-white/10 bg-black/45 p-4"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Missed Days</p>
            <p className="mt-2 text-2xl font-semibold text-rose-200">{discipline.daysMissedTotal}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-white/10 bg-black/45 p-4"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Perfect Days</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">
              {discipline.perfectDaysCount}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_28px_rgba(56,189,248,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Trends</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Performance Curves</h3>
          </div>
          <div className="inline-flex rounded-full border border-white/10 bg-black/40 p-1">
            <button
              type="button"
              onClick={() => setTrendWindow('7d')}
              className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                trendWindow === '7d'
                  ? 'bg-cyan-400/20 text-cyan-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              7D
            </button>
            <button
              type="button"
              onClick={() => setTrendWindow('30d')}
              className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                trendWindow === '30d'
                  ? 'bg-fuchsia-400/20 text-fuchsia-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              30D
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-200">
              <TrendingUp className="h-4 w-4 text-fuchsia-300" />
              XP Trend
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(2,6,23,0.9)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xpGained"
                    stroke="#d946ef"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-200">
              <CalendarClock className="h-4 w-4 text-emerald-300" />
              Habit Completion
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(2,6,23,0.9)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="habitsCompletionPercent"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-200">
              <Flame className="h-4 w-4 text-amber-300" />
              Quest Completion
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(2,6,23,0.9)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="questsCompletionPercent"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_28px_rgba(129,140,248,0.2)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">History Log</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Daily Summary Stream</h3>
          </div>
        </div>

        <div className="mt-5 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-black/35 p-2">
          {historyRows.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-400">No daily history yet.</p>
          )}

          <div className="space-y-2">
            {historyRows.map((row) => (
              <div
                key={row.date}
                className="grid gap-2 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs text-slate-300 md:grid-cols-[1.2fr_repeat(5,1fr)]"
              >
                <span className="font-semibold text-slate-100">{formatHistoryDate(row.date)}</span>
                <span className="text-emerald-300">XP +{row.xpGained}</span>
                <span className="text-rose-300">XP -{row.xpLost}</span>
                <span className="text-amber-300">Gold +{row.goldGained} / -{row.goldSpent}</span>
                <span>
                  Habits {row.habitsDone}/{row.habitsDone + row.habitsMissed}
                </span>
                <span>
                  Quests {row.questsDone}/{row.questsDone + row.questsFailed}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SettingsPanel
        settings={settings}
        onUpdateSettings={updateSettings}
        onUpdateProfile={updateProfile}
        playerName={profile.playerName}
        title={profile.title}
        onResetStreak={resetStreak}
        onHardReset={resetAllData}
      />
    </div>
  )
}

export default Profile

