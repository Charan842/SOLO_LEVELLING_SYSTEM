import { getDateRangeKeys, toDateKey } from './analytics'

export const ACHIEVEMENT_DEFS = [
  {
    id: 'streak-7',
    title: 'Streak Initiate',
    description: 'Reach a 7-day streak.',
    color: 'emerald',
  },
  {
    id: 'flawless-week',
    title: 'Flawless Week',
    description: 'Complete 100% of tasks for 7 days.',
    color: 'fuchsia',
  },
  {
    id: 'focus-consistent',
    title: 'Consistency Core',
    description: 'Maintain 80%+ average completion this week.',
    color: 'cyan',
  },
  {
    id: 'zero-fails-week',
    title: 'No-Fail Guard',
    description: 'Finish a full week without failed quests.',
    color: 'amber',
  },
  {
    id: 's-rank-day',
    title: 'S-Rank Day',
    description: 'Earn at least one S daily grade.',
    color: 'indigo',
  },
  {
    id: 'xp-500-week',
    title: 'XP Hunter',
    description: 'Gain 500+ XP in a week.',
    color: 'rose',
  },
]

export const getAchievementMap = (unlocked = {}) => {
  const map = {}
  ACHIEVEMENT_DEFS.forEach((achievement) => {
    const unlockedAt = unlocked?.[achievement.id] || ''
    map[achievement.id] = {
      ...achievement,
      unlocked: Boolean(unlockedAt),
      unlockedAt: unlockedAt || '',
    }
  })
  return map
}

const sevenDayRows = (rows = [], endDate = new Date()) => {
  const keys = new Set(getDateRangeKeys(7, endDate))
  return (rows || []).filter((row) => keys.has(row.date))
}

const sevenDayGrades = (gradingHistory = {}, endDate = new Date()) => {
  const keys = getDateRangeKeys(7, endDate)
  return keys.map((key) => gradingHistory?.[key]).filter(Boolean)
}

export const evaluateAchievementUnlocks = ({
  unlocked = {},
  discipline = {},
  weeklyPerformance = {},
  gradingHistory = {},
  historyRows = [],
  now = new Date(),
} = {}) => {
  const next = { ...(unlocked || {}) }
  const nowIso = now.toISOString()

  const rows7 = sevenDayRows(historyRows, now)
  const grades7 = sevenDayGrades(gradingHistory, now)

  const qualifies = {
    'streak-7': Number(discipline.currentStreak || 0) >= 7,
    'flawless-week':
      grades7.length === 7 &&
      grades7.every((entry) => Number(entry.completionPercent || 0) === 100),
    'focus-consistent': Number(weeklyPerformance.averageCompletion || 0) >= 80,
    'zero-fails-week':
      rows7.length === 7 && rows7.every((entry) => Number(entry.questsFailed || 0) === 0),
    's-rank-day': Object.values(gradingHistory || {}).some((entry) => entry?.grade === 'S'),
    'xp-500-week': Number(weeklyPerformance.weeklyXP || 0) >= 500,
  }

  Object.entries(qualifies).forEach(([id, ok]) => {
    if (ok && !next[id]) {
      next[id] = nowIso
    }
  })

  return next
}

export const buildAchievementList = (unlocked = {}) => {
  const map = getAchievementMap(unlocked)
  return ACHIEVEMENT_DEFS.map((achievement) => map[achievement.id])
}

export const countUnlockedAchievements = (unlocked = {}) =>
  Object.keys(unlocked || {}).filter((key) => Boolean(unlocked[key])).length

export const latestUnlock = (unlocked = {}) => {
  const entries = Object.entries(unlocked || {}).filter(([, value]) => Boolean(value))
  if (!entries.length) return null
  const [id, unlockedAt] = entries.sort((a, b) => (a[1] > b[1] ? -1 : 1))[0]
  const achievement = ACHIEVEMENT_DEFS.find((item) => item.id === id)
  return {
    id,
    unlockedAt,
    title: achievement?.title || id,
  }
}

export const isAchievementUnlockedToday = (unlockedAt = '', now = new Date()) => {
  const day = toDateKey(unlockedAt)
  return day && day === toDateKey(now)
}
