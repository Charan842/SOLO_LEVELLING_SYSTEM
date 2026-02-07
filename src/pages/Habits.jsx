import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Flame, Plus, Trash2 } from 'lucide-react'
import HabitHeatmap from '../components/HabitHeatmap'
import { useGame } from '../context/GameContext'
import { setLastAction } from '../utils/actionLog'
import { readStorage, writeStorage } from '../utils/storage'

const STORAGE_KEY = 'solo_leveling_habits_v1'

const todayKey = () => new Date().toISOString().slice(0, 10)

const buildHeatmapDays = (entries) => {
  const days = []
  for (let i = 34; i >= 0; i -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const key = date.toISOString().slice(0, 10)
    days.push({ date: key, count: entries[key] || 0 })
  }
  return days
}

const defaultHabits = [
  {
    id: 'core-touch-grass',
    title: 'Touch Grass (Sunlight + Walk) - 10 min',
    xpReward: 25,
    required: true,
    category: 'Core Daily',
  },
  {
    id: 'core-deep-focus',
    title: 'Deep Focus Session - 50 min',
    xpReward: 35,
    required: true,
    category: 'Core Daily',
  },
  {
    id: 'core-read',
    title: 'Read (Non-Fiction) - 1-5 pages',
    xpReward: 20,
    required: true,
    category: 'Core Daily',
  },
  {
    id: 'core-skill',
    title: 'Skill Practice / Learning - 30 min',
    xpReward: 30,
    required: true,
    category: 'Core Daily',
  },
  {
    id: 'core-training',
    title: 'Physical Training - 15-30 min',
    xpReward: 30,
    required: true,
    category: 'Core Daily',
  },
  {
    id: 'mind-plan',
    title: 'Plan Tomorrow - 5 min',
    xpReward: 15,
    required: true,
    category: 'Mental & Discipline',
  },
  {
    id: 'mind-no-junk',
    title: 'No Junk Dopamine Before Bed - 30 min',
    xpReward: 25,
    required: true,
    category: 'Mental & Discipline',
  },
  {
    id: 'mind-journal',
    title: 'Daily Journal - 3 lines',
    xpReward: 20,
    required: true,
    category: 'Mental & Discipline',
  },
  {
    id: 'elite-cold',
    title: 'Cold Shower / Cold Face Splash',
    xpReward: 15,
    required: true,
    category: 'Elite Optional',
  },
  {
    id: 'elite-meditation',
    title: 'Meditation - 5-10 min',
    xpReward: 20,
    required: true,
    category: 'Elite Optional',
  },
  {
    id: 'elite-zero-sugar',
    title: 'Zero Sugar Day',
    xpReward: 25,
    required: true,
    category: 'Elite Optional',
  },
]

const ensureDefaults = (items) => {
  const now = new Date().toISOString()
  const byId = new Map((items || []).map((habit) => [habit.id, habit]))
  const seeded = defaultHabits.map((habit) => {
    const existing = byId.get(habit.id)
    if (existing) {
      return {
        ...existing,
        title: habit.title,
        xpReward: habit.xpReward,
        required: true,
        category: habit.category,
      }
    }
    return {
      ...habit,
      streak: 0,
      history: {},
      lastCompleted: '',
      createdAt: now,
      updatedAt: now,
    }
  })

  const custom = (items || []).filter((habit) => !defaultHabits.some((core) => core.id === habit.id))
  return [...seeded, ...custom]
}

const loadHabits = () => ensureDefaults(readStorage(STORAGE_KEY, []))

const saveHabits = (habits) => writeStorage(STORAGE_KEY, habits)

const createHabit = (title) => {
  const now = new Date().toISOString()
  return {
    id: `habit-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    title,
    xpReward: 25,
    streak: 0,
    history: {},
    lastCompleted: '',
    createdAt: now,
    updatedAt: now,
  }
}

function Habits() {
  const { addXP, setStreak } = useGame()
  const [habits, setHabits] = useState(() => loadHabits())
  const [title, setTitle] = useState('')

  const updateHabits = (next) => {
    const normalized = ensureDefaults(next)
    setHabits(normalized)
    saveHabits(normalized)
  }

  const combinedStreak = useMemo(() => {
    if (habits.length === 0) return 0
    return habits.reduce((total, habit) => total + (habit.streak || 0), 0)
  }, [habits])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    const habit = createHabit(title.trim())
    const next = [habit, ...habits]
    updateHabits(next)
    setLastAction({ type: 'habit_add', habit })
    setTitle('')
  }

  const handleDelete = (habitId) => {
    const target = habits.find((habit) => habit.id === habitId)
    if (target?.required) return
    const next = habits.filter((habit) => habit.id !== habitId)
    updateHabits(next)
    if (target) {
      setLastAction({ type: 'habit_delete', habit: target })
    }
  }

  const completeHabit = (habitId) => {
    const today = todayKey()
    const now = new Date()
    let reward = 0

    let previousHabit = null
    const next = habits.map((habit) => {
      if (habit.id !== habitId) return habit
      if (habit.lastCompleted === today) return habit

      const history = { ...habit.history, [today]: 1 }
      const last = habit.lastCompleted ? new Date(habit.lastCompleted) : null
      const diffDays = last
        ? Math.floor((now - last) / (1000 * 60 * 60 * 24))
        : null
      const nextStreak = diffDays === 1 ? habit.streak + 1 : 1
      reward = habit.xpReward || 25
      previousHabit = habit

      return {
        ...habit,
        history,
        streak: nextStreak,
        lastCompleted: today,
        updatedAt: new Date().toISOString(),
      }
    })

    updateHabits(next)
    if (reward > 0) {
      addXP(reward, {
        trackHistory: true,
        dateKey: today,
        historyPatch: { habitsDoneDelta: 1 },
      })
    }
    if (previousHabit) {
      setLastAction({
        type: 'habit_complete',
        habitId,
        previousHabit,
        xp: reward,
      })
    }
  }

  const resetIfMissed = (habit) => {
    const today = todayKey()
    if (!habit.lastCompleted) return habit
    if (habit.lastCompleted === today) return habit

    const last = new Date(habit.lastCompleted)
    const diffDays = Math.floor((new Date(today) - last) / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) return habit

    return {
      ...habit,
      streak: 0,
      updatedAt: new Date().toISOString(),
    }
  }

  const normalizedHabits = useMemo(() => habits.map(resetIfMissed), [habits])

  useEffect(() => {
    const hasChanges = normalizedHabits.some(
      (habit, index) => habit.streak !== habits[index]?.streak
    )
    if (hasChanges) {
      updateHabits(normalizedHabits)
    }
  }, [normalizedHabits, habits])

  const globalHeatmap = useMemo(() => {
    const entries = {}
    habits.forEach((habit) => {
      Object.entries(habit.history || {}).forEach(([date, count]) => {
        entries[date] = (entries[date] || 0) + count
      })
    })
    return buildHeatmapDays(entries)
  }, [habits])

  const handleSyncStreak = () => {
    setStreak(combinedStreak)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Habit Engine</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Daily Rituals</h2>
            <p className="text-sm text-slate-300">
              Every completed habit feeds your streak. Missed days reset it.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200">
            <Flame className="h-4 w-4 text-rose-300" />
            {combinedStreak} Total Streak
          </div>
        </div>

        <div className="mt-6">
          <HabitHeatmap days={globalHeatmap} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
          >
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a habit"
              className="flex-1 rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
            >
              <Plus className="h-4 w-4" />
              Add Habit
            </button>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {habits.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                No habits yet. Add your first ritual.
              </div>
            )}
            {habits.map((habit) => (
              <motion.div
                key={habit.id}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-black/50 p-4 shadow-[0_0_18px_rgba(15,23,42,0.45)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{habit.title}</h3>
                    <p className="text-xs text-slate-400">
                      Reward {habit.xpReward} XP - {habit.category || 'Custom'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
                      {habit.streak} streak
                    </span>
                    {habit.required && (
                      <span className="rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-fuchsia-200">
                        Non-negotiable
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Last done: {habit.lastCompleted || 'Never'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => completeHabit(habit.id)}
                      className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Mark Done
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(habit.id)}
                      disabled={habit.required}
                      className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        habit.required
                          ? 'border-white/10 bg-white/5 text-slate-500'
                          : 'border-rose-400/40 bg-rose-400/10 text-rose-100 hover:bg-rose-400/20'
                      }`}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Streak Sync</h3>
            <p className="mt-2 text-sm text-slate-400">
              Sync combined habit streak into your global player streak.
            </p>
            <button
              type="button"
              onClick={handleSyncStreak}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/20"
            >
              <Flame className="h-4 w-4" />
              Sync Streak
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Rules</h3>
            <ul className="mt-3 text-sm text-slate-400">
              <li>Each habit gives 25 XP per day.</li>
              <li>Missing a day resets that habit streak.</li>
              <li>Sync to apply habits to global streak.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Habits
