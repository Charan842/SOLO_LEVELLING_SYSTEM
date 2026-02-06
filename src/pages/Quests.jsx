import { useEffect, useMemo, useState } from 'react'
import { Plus, ScrollText } from 'lucide-react'
import PomodoroTimer from '../components/PomodoroTimer'
import QuestCard from '../components/QuestCard'
import { useGame } from '../context/GameContext'
import { setLastAction } from '../utils/actionLog'
import { readStorage, readString, writeStorage, writeString } from '../utils/storage'

const STORAGE_KEY = 'solo_leveling_quests_v1'
const FOCUS_KEY = 'solo_leveling_focus_v1'
const DAILY_SEED_KEY = 'solo_leveling_daily_seed_v1'

const baseRewards = {
  Easy: { xp: 40, gold: 25 },
  Normal: { xp: 80, gold: 50 },
  Hard: { xp: 140, gold: 90 },
}

const todayDate = () => new Date().toISOString().slice(0, 10)

const createQuest = (payload) => {
  const now = new Date().toISOString()
  return {
    id: payload.id || `quest-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    title: payload.title,
    difficulty: payload.difficulty,
    xp: payload.xp,
    gold: payload.gold,
    deadline: payload.deadline,
    status: 'active',
    isDaily: Boolean(payload.isDaily),
    dailyKey: payload.dailyKey || '',
    createdAt: now,
    updatedAt: now,
  }
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/(^-|-$)+/g, '')

const buildDailyTemplates = (dateKey) => {
  const day = new Date(dateKey)
  const isEven = day.getDate() % 2 === 0
  const leetTitle = isEven ? 'Solve 1 LeetCode Hard' : 'Solve 2 LeetCode Medium'
  const leetDifficulty = isEven ? 'Hard' : 'Normal'

  const templates = [
    { title: leetTitle, difficulty: leetDifficulty },
    { title: 'Build 1 small feature / fix 1 bug (ship something)', difficulty: 'Hard' },
    { title: "Summarize today's learning in 5 bullet points", difficulty: 'Easy' },
    { title: 'Teach/explain one concept out loud (5 min)', difficulty: 'Easy' },
    { title: '20-minute cardio OR 8k steps', difficulty: 'Normal' },
    { title: 'Zero procrastination block (25 min)', difficulty: 'Normal' },
    { title: "Plan tomorrow's top 3 tasks", difficulty: 'Easy' },
    { title: 'Clean workspace (2-5 min reset)', difficulty: 'Easy' },
    { title: 'Read 5 pages (non-fiction)', difficulty: 'Easy' },
    { title: 'Journal 3 lines (wins, lesson, next step)', difficulty: 'Easy' },
    { title: 'Reach out to Harshini(W) (network)', difficulty: 'Normal' },
  ]

  return templates.map((template) => ({
    ...template,
    dailyKey: `daily-${dateKey}-${slugify(template.title)}`,
  }))
}

const seedDailyQuests = (items, dateKey) => {
  const existing = Array.isArray(items) ? items : []
  const existingKeys = new Set(existing.map((quest) => quest.dailyKey).filter(Boolean))
  const templates = buildDailyTemplates(dateKey)
  const newQuests = templates
    .filter((template) => !existingKeys.has(template.dailyKey))
    .map((template) => {
      const rewards = baseRewards[template.difficulty] || baseRewards.Normal
      return createQuest({
        id: template.dailyKey,
        title: template.title,
        difficulty: template.difficulty,
        xp: rewards.xp,
        gold: rewards.gold,
        deadline: dateKey,
        isDaily: true,
        dailyKey: template.dailyKey,
      })
    })

  if (!newQuests.length) return existing
  return [...newQuests, ...existing]
}

const loadQuests = () => {
  const stored = readStorage(STORAGE_KEY, [])
  const today = todayDate()
  const lastSeed = readString(DAILY_SEED_KEY, '')
  if (lastSeed !== today) {
    const seeded = seedDailyQuests(stored, today)
    writeStorage(STORAGE_KEY, seeded)
    writeString(DAILY_SEED_KEY, today)
    return seeded
  }
  return stored
}

const saveQuests = (quests) => {
  writeStorage(STORAGE_KEY, quests)
}

function Quests() {
  const { addXP, removeXP, addGold } = useGame()
  const [quests, setQuests] = useState(() => loadQuests())
  const [form, setForm] = useState({
    title: '',
    difficulty: 'Normal',
    deadline: '',
  })
  const [focusId, setFocusId] = useState(() => readString(FOCUS_KEY, ''))

  const activeQuests = useMemo(
    () => quests.filter((quest) => quest.status === 'active'),
    [quests]
  )
  const completedQuests = useMemo(
    () => quests.filter((quest) => quest.status === 'completed'),
    [quests]
  )
  const failedQuests = useMemo(
    () => quests.filter((quest) => quest.status === 'failed'),
    [quests]
  )

  const updateQuests = (next) => {
    setQuests(next)
    saveQuests(next)
  }

  useEffect(() => {
    const refreshDaily = () => {
      const today = todayDate()
      const lastSeed = readString(DAILY_SEED_KEY, '')
      if (lastSeed === today) return
      const seeded = seedDailyQuests(readStorage(STORAGE_KEY, []), today)
      updateQuests(seeded)
      writeString(DAILY_SEED_KEY, today)
    }

    refreshDaily()
    const timer = setInterval(refreshDaily, 60 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const updateFocus = (id) => {
    setFocusId(id)
    writeString(FOCUS_KEY, id || '')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) return

    const rewards = baseRewards[form.difficulty] || baseRewards.Normal
    const quest = createQuest({
      title: form.title.trim(),
      difficulty: form.difficulty,
      xp: rewards.xp,
      gold: rewards.gold,
      deadline: form.deadline || todayDate(),
    })

    const next = [quest, ...quests]
    updateQuests(next)
    setLastAction({ type: 'quest_add', quest })
    setForm({ title: '', difficulty: 'Normal', deadline: '' })
  }

  const handleComplete = (id) => {
    const timestamp = new Date().toISOString()
    const next = quests.map((quest) => {
      if (quest.id !== id) return quest
      return {
        ...quest,
        status: 'completed',
        completedAt: timestamp,
        updatedAt: timestamp,
      }
    })
    const completed = quests.find((quest) => quest.id === id)
    if (completed && completed.status === 'active') {
      const bonus = focusId && completed.id === focusId ? Math.ceil(completed.xp * 0.1) : 0
      const totalXp = completed.xp + bonus
      addXP(totalXp)
      addGold(completed.gold)
      setLastAction({
        type: 'quest_complete',
        questId: completed.id,
        xp: totalXp,
        gold: completed.gold,
      })
      if (focusId === completed.id) {
        updateFocus('')
      }
    }
    updateQuests(next)
  }

  const handleFail = (id) => {
    const timestamp = new Date().toISOString()
    const next = quests.map((quest) => {
      if (quest.id !== id) return quest
      return {
        ...quest,
        status: 'failed',
        failedAt: timestamp,
        updatedAt: timestamp,
      }
    })
    const failed = quests.find((quest) => quest.id === id)
    if (failed && failed.status === 'active') {
      removeXP(failed.xp)
      setLastAction({ type: 'quest_fail', questId: failed.id, xp: failed.xp })
      if (focusId === failed.id) {
        updateFocus('')
      }
    }
    updateQuests(next)
  }

  const handleDelete = (id) => {
    const target = quests.find((quest) => quest.id === id)
    const next = quests.filter((quest) => quest.id !== id)
    updateQuests(next)
    if (focusId === id) {
      updateFocus('')
    }
    if (target) {
      setLastAction({ type: 'quest_delete', quest: target })
    }
  }

  const handleFocus = (id) => {
    if (focusId === id) {
      updateFocus('')
      return
    }
    updateFocus(id)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(124,58,237,0.3)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Quest Board</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Active Missions</h2>
            <p className="text-sm text-slate-300">
              Complete quests to earn XP and gold. Failures cost XP.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200">
            <ScrollText className="h-4 w-4 text-fuchsia-300" />
            {activeQuests.length} Active
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Quest title"
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none"
          />
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white focus:border-fuchsia-400/60 focus:outline-none"
          >
            <option>Easy</option>
            <option>Normal</option>
            <option>Hard</option>
          </select>
          <input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
            className="rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white focus:border-fuchsia-400/60 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-3 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/20"
          >
            <Plus className="h-4 w-4" />
            Add Quest
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Active</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeQuests.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                No active quests. Add one to begin your ascent.
              </div>
            )}
            {activeQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={handleComplete}
                onFail={handleFail}
                onDelete={handleDelete}
                onFocus={handleFocus}
                isFocus={focusId === quest.id}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <PomodoroTimer />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Completed</h3>
            <div className="mt-3 space-y-3">
              {completedQuests.length === 0 && (
                <p className="text-sm text-slate-400">No completed quests yet.</p>
              )}
              {completedQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100"
                >
                  {quest.title}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-lg font-semibold text-white">Failed</h3>
            <div className="mt-3 space-y-3">
              {failedQuests.length === 0 && (
                <p className="text-sm text-slate-400">No failed quests.</p>
              )}
              {failedQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100"
                >
                  {quest.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Quests
