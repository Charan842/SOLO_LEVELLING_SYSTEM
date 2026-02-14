import { readStorage, readString, writeStorage, writeString } from './storage'

export const HABITS_STORAGE_KEY = 'solo_leveling_habits_v1'
export const QUESTS_STORAGE_KEY = 'solo_leveling_quests_v1'
const MIGRATION_KEY = 'solo_leveling_fixed_lists_v1_installed'
const LEGACY_KEYS = ['habits', 'quests']

// Old rotating/default lists were intentionally removed.
// This is the fixed habit set requested by the user.
export const FIXED_HABIT_TEMPLATES = [
  {
    id: 'habit-early-wakeup-college',
    title: 'Early wake up, fresh & attend college',
    xpReward: 30,
    xpPenalty: 10,
  },
  {
    id: 'habit-workout',
    title: 'Workout',
    xpReward: 35,
    xpPenalty: 15,
  },
  {
    id: 'habit-no-outside-food',
    title: 'No outside food',
    xpReward: 25,
    xpPenalty: 10,
  },
  {
    id: 'habit-emotional-strength',
    title: 'Try to build emotional strength',
    xpReward: 25,
    xpPenalty: 10,
  },
  {
    id: 'habit-normal-human',
    title: 'Try to be a normal human',
    xpReward: 20,
    xpPenalty: 5,
  },
]

// Old rotating/default lists were intentionally removed.
// This is the fixed quest set requested by the user.
export const FIXED_QUEST_TEMPLATES = [
  {
    id: 'quest-practice-leetcode',
    title: 'Practice on LeetCode',
    difficulty: 'Hard',
    xp: 140,
    gold: 90,
  },
  {
    id: 'quest-practice-pyq-goal',
    title: 'Practice PYQ (Goal)',
    difficulty: 'Normal',
    xp: 80,
    gold: 50,
  },
  {
    id: 'quest-meditation',
    title: 'Meditation',
    difficulty: 'Easy',
    xp: 40,
    gold: 25,
  },
  {
    id: 'quest-walk-8000-steps-2km',
    title: 'Walk 8000 steps or 2 km',
    difficulty: 'Normal',
    xp: 80,
    gold: 50,
  },
  {
    id: 'quest-practice-communication',
    title: 'Practice communication',
    difficulty: 'Easy',
    xp: 40,
    gold: 25,
  },
]

export const ensureFixedHabits = (items = []) => {
  const now = new Date().toISOString()
  const byId = new Map((items || []).map((habit) => [habit.id, habit]))

  return FIXED_HABIT_TEMPLATES.map((template) => {
    const existing = byId.get(template.id)
    return {
      id: template.id,
      title: template.title,
      xpReward: template.xpReward,
      xpPenalty: template.xpPenalty,
      required: true,
      locked: true,
      category: 'Fixed',
      streak: Number(existing?.streak) || 0,
      history: existing?.history || {},
      lastCompleted: existing?.lastCompleted || '',
      createdAt: existing?.createdAt || now,
      updatedAt: existing?.updatedAt || now,
    }
  })
}

export const ensureFixedQuests = (items = []) => {
  const now = new Date().toISOString()
  const byId = new Map((items || []).map((quest) => [quest.id, quest]))

  return FIXED_QUEST_TEMPLATES.map((template) => {
    const existing = byId.get(template.id)
    return {
      id: template.id,
      title: template.title,
      difficulty: template.difficulty,
      xp: template.xp,
      gold: template.gold,
      deadline: existing?.deadline || '',
      status: existing?.status || 'active',
      createdAt: existing?.createdAt || now,
      updatedAt: existing?.updatedAt || now,
      completedAt: existing?.completedAt || null,
      failedAt: existing?.failedAt || null,
    }
  })
}

export const installFixedDataOnce = () => {
  if (typeof window === 'undefined') return
  const installed = readString(MIGRATION_KEY, '')
  if (installed === 'true') return

  // One-time reset is required so legacy keys and old rotating lists
  // do not leak into the new fixed habit/quest system.
  LEGACY_KEYS.forEach((key) => window.localStorage.removeItem(key))

  writeStorage(HABITS_STORAGE_KEY, ensureFixedHabits([]))
  writeStorage(QUESTS_STORAGE_KEY, ensureFixedQuests([]))

  // Remove old daily-seeding marker because quests are now fixed.
  window.localStorage.removeItem('solo_leveling_daily_seed_v1')

  writeString(MIGRATION_KEY, 'true')
}

export const loadFixedHabits = () => {
  installFixedDataOnce()
  return ensureFixedHabits(readStorage(HABITS_STORAGE_KEY, []))
}

export const loadFixedQuests = () => {
  installFixedDataOnce()
  return ensureFixedQuests(readStorage(QUESTS_STORAGE_KEY, []))
}
