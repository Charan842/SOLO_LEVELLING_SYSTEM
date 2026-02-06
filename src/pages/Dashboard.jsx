import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CalendarDays, Crown, Flame, Gem, ShieldCheck } from 'lucide-react'
import HabitHeatmap from '../components/HabitHeatmap'
import PlayerStats from '../components/PlayerStats'
import UserGuide from '../components/UserGuide'
import { useGame } from '../context/GameContext'
import { clearLastAction, getLastAction } from '../utils/actionLog'
import { readStorage, readString, writeStorage, writeString } from '../utils/storage'

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

function InfoCard({ label, value, caption, icon: Icon, accent }) {
  return (
    <motion.div
      variants={cardVariants}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_18px_rgba(15,23,42,0.45)]"
    >
      <div
        className="absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-2 text-xl font-semibold text-white">{value}</p>
          {caption && <p className="mt-1 text-xs text-slate-400">{caption}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
          <Icon className="h-5 w-5 text-white/80" />
        </div>
      </div>
    </motion.div>
  )
}

function Dashboard() {
  const { level, rank, gold, streak, addXP, removeXP, addGold, spendGold } = useGame()
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const [activityRange, setActivityRange] = useState('weekly')
  const [activityData, setActivityData] = useState({
    weekly: [],
    monthly: [],
    heatmap: [],
  })
  const fileInputRef = useRef(null)

  const buildActivityData = () => {
    const quests = readStorage('solo_leveling_quests_v1', [])
    const habits = readStorage('solo_leveling_habits_v1', [])
    const questTotals = {}
    const habitTotals = {}

    quests
      .filter((quest) => quest.status === 'completed')
      .forEach((quest) => {
        const date =
          (quest.completedAt || quest.updatedAt || quest.createdAt || '').slice(0, 10) ||
          null
        if (!date) return
        if (!questTotals[date]) {
          questTotals[date] = { count: 0, xp: 0 }
        }
        questTotals[date].count += 1
        questTotals[date].xp += Number(quest.xp) || 0
      })

    habits.forEach((habit) => {
      const xpReward = Number(habit.xpReward) || 25
      const history = habit.history || {}
      Object.entries(history).forEach(([date, count]) => {
        const times = Number(count) || 0
        if (!times) return
        if (!habitTotals[date]) {
          habitTotals[date] = { count: 0, xp: 0 }
        }
        habitTotals[date].count += times
        habitTotals[date].xp += times * xpReward
      })
    })

    const buildDays = (length, getLabel) =>
      Array.from({ length }, (_, index) => {
        const date = new Date()
        date.setDate(date.getDate() - (length - 1 - index))
        const key = date.toISOString().slice(0, 10)
        const label = getLabel(date, index)
        const quest = questTotals[key] || { count: 0, xp: 0 }
        const habit = habitTotals[key] || { count: 0, xp: 0 }
        return {
          day: label,
          xp: quest.xp + habit.xp,
          quests: quest.count,
          habits: habit.count,
          key,
        }
      })

    const weekly = buildDays(7, (date) =>
      date.toLocaleDateString('en-US', { weekday: 'short' })
    )

    const monthlyBuckets = Array.from({ length: 4 }, (_, index) => ({
      day: `W${index + 1}`,
      xp: 0,
      quests: 0,
      habits: 0,
    }))
    const monthlyDays = buildDays(28, () => '')
    monthlyDays.forEach((entry, index) => {
      const bucketIndex = Math.floor(index / 7)
      const bucket = monthlyBuckets[bucketIndex]
      if (!bucket) return
      bucket.xp += entry.xp
      bucket.quests += entry.quests
      bucket.habits += entry.habits
    })

    const heatmapEntries = {}
    weekly.concat(monthlyDays).forEach((entry) => {
      const key = entry.key
      if (!key) return
      heatmapEntries[key] = (heatmapEntries[key] || 0) + entry.quests + entry.habits
    })

    const heatmap = []
    for (let i = 34; i >= 0; i -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().slice(0, 10)
      heatmap.push({ date: key, count: heatmapEntries[key] || 0 })
    }

    return { weekly, monthly: monthlyBuckets, heatmap }
  }

  useEffect(() => {
    const refresh = () => {
      setActivityData(buildActivityData())
    }

    refresh()
    const timer = setInterval(refresh, 2000)
    return () => clearInterval(timer)
  }, [])

  const rangeData = activityRange === 'monthly' ? activityData.monthly : activityData.weekly
  const rangeXp = useMemo(
    () => rangeData.reduce((total, entry) => total + entry.xp, 0),
    [rangeData]
  )
  const rangeWins = useMemo(
    () => rangeData.reduce((total, entry) => total + entry.quests + entry.habits, 0),
    [rangeData]
  )

  const focusId = readString('solo_leveling_focus_v1', '')
  const focusQuest = focusId
    ? readStorage('solo_leveling_quests_v1', []).find((quest) => quest.id === focusId)
    : null

  const handleExport = () => {
    const payload = {
      version: 1,
      state: readStorage('solo_leveling_state_v1', {}),
      quests: readStorage('solo_leveling_quests_v1', []),
      habits: readStorage('solo_leveling_habits_v1', []),
      rewards: readStorage('solo_leveling_rewards_v1', []),
      rewardLog: readStorage('solo_leveling_reward_log_v1', []),
      awakening: readStorage('solo_leveling_awakening_v1', {}),
      focusId: readString('solo_leveling_focus_v1', ''),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `solo-leveling-backup-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (data.state) writeStorage('solo_leveling_state_v1', data.state)
        if (data.quests) writeStorage('solo_leveling_quests_v1', data.quests)
        if (data.habits) writeStorage('solo_leveling_habits_v1', data.habits)
        if (data.rewards) writeStorage('solo_leveling_rewards_v1', data.rewards)
        if (data.rewardLog) writeStorage('solo_leveling_reward_log_v1', data.rewardLog)
        if (data.awakening) writeStorage('solo_leveling_awakening_v1', data.awakening)
        if (typeof data.focusId === 'string') writeString('solo_leveling_focus_v1', data.focusId)
        window.location.reload()
      } catch (error) {
        // swallow errors
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleResetSeason = () => {
    const proceed = window.confirm('Reset season? This will clear quests, habits, rewards, and XP.')
    if (!proceed) return
    writeStorage('solo_leveling_state_v1', { xp: 0, level: 1, gold: 0, streak: 0, rank: 'E' })
    writeStorage('solo_leveling_quests_v1', [])
    writeStorage('solo_leveling_habits_v1', [])
    window.localStorage.removeItem('solo_leveling_rewards_v1')
    window.localStorage.removeItem('solo_leveling_reward_log_v1')
    writeString('solo_leveling_focus_v1', '')
    window.location.reload()
  }

  const handleUndo = () => {
    const action = getLastAction()
    if (!action) return
    if (action.type === 'quest_add') {
      const quests = readStorage('solo_leveling_quests_v1', [])
      writeStorage(
        'solo_leveling_quests_v1',
        quests.filter((quest) => quest.id !== action.quest.id)
      )
    }
    if (action.type === 'quest_delete') {
      const quests = readStorage('solo_leveling_quests_v1', [])
      writeStorage('solo_leveling_quests_v1', [action.quest, ...quests])
    }
    if (action.type === 'quest_complete') {
      const quests = readStorage('solo_leveling_quests_v1', [])
      writeStorage(
        'solo_leveling_quests_v1',
        quests.map((quest) =>
          quest.id === action.questId
            ? { ...quest, status: 'active', completedAt: null, updatedAt: new Date().toISOString() }
            : quest
        )
      )
      removeXP(action.xp)
      spendGold(action.gold)
    }
    if (action.type === 'quest_fail') {
      const quests = readStorage('solo_leveling_quests_v1', [])
      writeStorage(
        'solo_leveling_quests_v1',
        quests.map((quest) =>
          quest.id === action.questId
            ? { ...quest, status: 'active', failedAt: null, updatedAt: new Date().toISOString() }
            : quest
        )
      )
      addXP(action.xp)
    }
    if (action.type === 'habit_add') {
      const habits = readStorage('solo_leveling_habits_v1', [])
      writeStorage(
        'solo_leveling_habits_v1',
        habits.filter((habit) => habit.id !== action.habit.id)
      )
    }
    if (action.type === 'habit_delete') {
      const habits = readStorage('solo_leveling_habits_v1', [])
      writeStorage('solo_leveling_habits_v1', [action.habit, ...habits])
    }
    if (action.type === 'habit_complete') {
      const habits = readStorage('solo_leveling_habits_v1', [])
      writeStorage(
        'solo_leveling_habits_v1',
        habits.map((habit) => (habit.id === action.habitId ? action.previousHabit : habit))
      )
      removeXP(action.xp)
    }
    if (action.type === 'reward_redeem') {
      const rewards = readStorage('solo_leveling_rewards_v1', [])
      writeStorage(
        'solo_leveling_rewards_v1',
        rewards.map((reward) =>
          reward.id === action.rewardId ? action.previousReward : reward
        )
      )
      addGold(action.cost)
    }
    if (action.type === 'xp_gain') {
      removeXP(action.amount)
    }
    if (action.type === 'xp_loss') {
      addXP(action.amount)
    }

    clearLastAction()
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <PlayerStats />

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.section
          initial="initial"
          animate="animate"
          variants={cardVariants}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Hunter Briefing
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">Gate Status</h3>
              <p className="text-sm text-slate-300">
                Stay sharp. Clear one gate to maintain momentum.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200">
              <CalendarDays className="h-4 w-4 text-cyan-300" />
              {todayLabel}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>Directive</span>
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Complete your highest XP quest and lock in a habit streak. Every win
                compounds your rank.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Discipline
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Focus
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  Momentum
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>System Note</span>
                <Crown className="h-4 w-4 text-fuchsia-300" />
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Rank advancement is locked to consistent XP gains. Avoid failed quests to
                preserve your level buffer.
              </p>
              <div className="mt-4 text-xs text-slate-400">
                Current standing: <span className="text-slate-200">Level {level}</span> -
                <span className="text-slate-200"> Rank {rank}</span>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial="initial"
          animate="animate"
          variants={cardVariants}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="space-y-4"
        >
          <InfoCard
            label="Rank"
            value={`Rank ${rank}`}
            caption={`Level ${level}`}
            icon={Crown}
            accent="rgba(147,51,234,0.55)"
          />
          <InfoCard
            label="Gold Reserve"
            value={`${gold} G`}
            caption="Spend wisely in the Rewards vault."
            icon={Gem}
            accent="rgba(251,191,36,0.5)"
          />
          <InfoCard
            label="Streak"
            value={`${streak} days`}
            caption="Missed days reset the chain."
            icon={Flame}
            accent="rgba(248,113,113,0.5)"
          />
        </motion.section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(147,51,234,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Today Focus</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Primary Gate</h3>
            </div>
            <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs text-fuchsia-100">
              +10% XP bonus
            </span>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-slate-300">
            {focusQuest ? (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-white">{focusQuest.title}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {focusQuest.difficulty} · {focusQuest.xp} XP · {focusQuest.gold} G
                </p>
                <p className="text-xs text-slate-400">
                  Deadline: {focusQuest.deadline || 'No deadline'}
                </p>
              </div>
            ) : (
              <p>No focus quest selected. Set one in Quests to lock your bonus.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Heatmap</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Activity Trace</h3>
            </div>
          </div>
          <div className="mt-4">
            <HabitHeatmap days={activityData.heatmap} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(59,130,246,0.25)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Performance
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {activityRange === 'monthly' ? 'Monthly' : 'Weekly'} XP Activity
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivityRange('weekly')}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] transition ${
                    activityRange === 'weekly'
                      ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  Weekly
                </button>
                <button
                  type="button"
                  onClick={() => setActivityRange('monthly')}
                  className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.3em] transition ${
                    activityRange === 'monthly'
                      ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-100'
                      : 'border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  Monthly
                </button>
              </div>
              <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-fuchsia-100">
                {rangeXp} XP
              </span>
              <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                {rangeWins} Wins
              </span>
            </div>
          </div>

          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rangeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.7} />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                  cursor={{ stroke: '#a855f7', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#xpGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(56,189,248,0.2)]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Completions</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Quest + Habit Wins</h3>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rangeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.9)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Bar dataKey="quests" stackId="wins" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="habits" stackId="wins" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">System Tools</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Backup & Control</h3>
            <p className="text-sm text-slate-300">
              Export, import, undo your last action, or reset the season.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/20"
          >
            Undo Last Action
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Export Profile
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/30"
          >
            Import Profile
          </button>
          <button
            type="button"
            onClick={handleResetSeason}
            className="rounded-full border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/20"
          >
            Reset Season
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </section>

      <UserGuide />
    </div>
  )
}

export default Dashboard
