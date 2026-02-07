const DAY_MS = 24 * 60 * 60 * 1000

const numberOrZero = (value) => {
  const next = Number(value)
  return Number.isFinite(next) ? next : 0
}

const ensureDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(value)))

const toPercent = (part, whole) => {
  if (!whole) return 0
  return clampPercent((numberOrZero(part) / numberOrZero(whole)) * 100)
}

const normalizeDifficulty = (value) => {
  const label = String(value || '').toLowerCase()
  if (label === 'easy') return 'Easy'
  if (label === 'hard') return 'Hard'
  return 'Normal'
}

const buildEmptyDay = (dateKey, totalHabits = 0) => ({
  date: dateKey,
  xpGained: 0,
  xpLost: 0,
  goldGained: 0,
  goldSpent: 0,
  habitsDone: 0,
  habitsMissed: 0,
  questsDone: 0,
  questsFailed: 0,
  totalHabits,
  perfectDay: false,
})

const normalizeDayRecord = (dateKey, record = {}, totalHabits = 0) => {
  const total = Math.max(numberOrZero(record.totalHabits), totalHabits)
  return {
    date: dateKey,
    xpGained: Math.max(0, numberOrZero(record.xpGained)),
    xpLost: Math.max(0, numberOrZero(record.xpLost)),
    goldGained: Math.max(0, numberOrZero(record.goldGained)),
    goldSpent: Math.max(0, numberOrZero(record.goldSpent)),
    habitsDone: Math.max(0, numberOrZero(record.habitsDone)),
    habitsMissed: Math.max(0, numberOrZero(record.habitsMissed)),
    questsDone: Math.max(0, numberOrZero(record.questsDone)),
    questsFailed: Math.max(0, numberOrZero(record.questsFailed)),
    totalHabits: Math.max(0, total),
    perfectDay: Boolean(record.perfectDay),
  }
}

const getQuestEventDate = (quest, status) => {
  if (!quest || quest.status !== status) return ''
  if (status === 'completed') {
    return toDateKey(quest.completedAt || quest.updatedAt || quest.createdAt || '')
  }
  if (status === 'failed') {
    return toDateKey(quest.failedAt || quest.updatedAt || quest.createdAt || '')
  }
  return ''
}

const longestRun = (keys, checker) => {
  let longest = 0
  let running = 0
  keys.forEach((key) => {
    if (checker(key)) {
      running += 1
      if (running > longest) longest = running
      return
    }
    running = 0
  })
  return longest
}

const trailingRun = (keys, checker) => {
  let count = 0
  for (let i = keys.length - 1; i >= 0; i -= 1) {
    if (!checker(keys[i])) break
    count += 1
  }
  return count
}

export const toDateKey = (value = new Date()) => {
  const date = ensureDate(value)
  if (!date) return ''
  return date.toISOString().slice(0, 10)
}

export const fromDateKey = (value) => ensureDate(`${value}T00:00:00.000Z`)

export const getDateRangeKeys = (days, endDate = new Date()) => {
  const length = Math.max(0, Math.floor(numberOrZero(days)))
  if (!length) return []
  const endKey = toDateKey(endDate)
  const end = fromDateKey(endKey)
  if (!end) return []
  return Array.from({ length }, (_, index) => {
    const date = new Date(end)
    date.setUTCDate(end.getUTCDate() - (length - 1 - index))
    return toDateKey(date)
  })
}

export const formatDateLabel = (dateKey, mode = 'weekly') => {
  const date = fromDateKey(dateKey)
  if (!date) return ''
  if (mode === 'weekly') {
    return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export const resolveFirstUseDate = ({
  state = {},
  quests = [],
  habits = [],
  rewardLog = [],
  dailyHistory = {},
} = {}) => {
  const candidates = []

  const pushCandidate = (value) => {
    const date = ensureDate(value)
    if (!date) return
    candidates.push(date)
  }

  pushCandidate(state.firstUseAt)
  pushCandidate(state.createdAt)

  Object.keys(dailyHistory || {}).forEach((dateKey) => {
    pushCandidate(`${dateKey}T00:00:00.000Z`)
  })

  quests.forEach((quest) => {
    pushCandidate(quest.createdAt)
    pushCandidate(quest.completedAt)
    pushCandidate(quest.failedAt)
  })

  habits.forEach((habit) => {
    pushCandidate(habit.createdAt)
    pushCandidate(habit.lastCompleted)
    Object.keys(habit.history || {}).forEach((dateKey) => {
      pushCandidate(`${dateKey}T00:00:00.000Z`)
    })
  })

  rewardLog.forEach((entry) => {
    pushCandidate(entry.at)
  })

  if (!candidates.length) return new Date().toISOString()
  const minTime = Math.min(...candidates.map((item) => item.getTime()))
  return new Date(minTime).toISOString()
}

export const getAccountAgeDays = (firstUseAt, endDate = new Date()) => {
  const startKey = toDateKey(firstUseAt)
  const endKey = toDateKey(endDate)
  const start = fromDateKey(startKey)
  const end = fromDateKey(endKey)
  if (!start || !end) return 1
  const diff = Math.floor((end - start) / DAY_MS) + 1
  return Math.max(1, diff)
}

export const getHabitDayStats = (habits = [], dateKey = toDateKey()) => {
  const total = habits.length
  const completed = habits.reduce((sum, habit) => {
    const done = numberOrZero((habit.history || {})[dateKey]) > 0
    return sum + (done ? 1 : 0)
  }, 0)
  const missed = Math.max(0, total - completed)
  return {
    date: dateKey,
    total,
    completed,
    missed,
    completionPercent: toPercent(completed, total),
  }
}

export const getHabitRangeStats = (habits = [], days = 7, endDate = new Date()) => {
  const keys = getDateRangeKeys(days, endDate)
  const daily = keys.map((dateKey) => getHabitDayStats(habits, dateKey))
  const completed = daily.reduce((sum, item) => sum + item.completed, 0)
  const missed = daily.reduce((sum, item) => sum + item.missed, 0)

  const bestStreak = habits.reduce((best, habit) => {
    const history = habit.history || {}
    const longest = longestRun(keys, (dateKey) => numberOrZero(history[dateKey]) > 0)
    return Math.max(best, longest)
  }, 0)

  const currentStreak = habits.reduce((best, habit) => {
    const fallback = trailingRun(keys, (dateKey) => numberOrZero((habit.history || {})[dateKey]) > 0)
    const stored = Math.max(0, numberOrZero(habit.streak))
    return Math.max(best, stored, fallback)
  }, 0)

  return {
    days,
    completed,
    missed,
    completionPercent: toPercent(completed, completed + missed),
    bestStreak,
    currentStreak,
    daily,
  }
}

export const getHabitMonthlyStats = (habits = [], endDate = new Date()) => {
  const range = getHabitRangeStats(habits, 30, endDate)
  const totalHabitDays = range.daily.filter((item) => item.completed > 0).length
  const missedDays = range.daily.filter((item) => item.completed === 0).length
  return {
    totalHabitDays,
    missedDays,
    consistencyPercent: range.completionPercent,
    completionPercent: range.completionPercent,
    daily: range.daily,
  }
}

export const getQuestDayStats = (quests = [], dateKey = toDateKey()) => {
  const completed = quests.filter((quest) => getQuestEventDate(quest, 'completed') === dateKey)
  const failed = quests.filter((quest) => getQuestEventDate(quest, 'failed') === dateKey)
  return {
    date: dateKey,
    completed: completed.length,
    failed: failed.length,
    completionPercent: toPercent(completed.length, completed.length + failed.length),
    byDifficulty: {
      Easy: completed.filter((quest) => normalizeDifficulty(quest.difficulty) === 'Easy').length,
      Normal: completed.filter((quest) => normalizeDifficulty(quest.difficulty) === 'Normal').length,
      Hard: completed.filter((quest) => normalizeDifficulty(quest.difficulty) === 'Hard').length,
    },
  }
}

export const getQuestRangeStats = (quests = [], days = 7, endDate = new Date()) => {
  const keys = getDateRangeKeys(days, endDate)
  const daily = keys.map((dateKey) => getQuestDayStats(quests, dateKey))
  const completed = daily.reduce((sum, item) => sum + item.completed, 0)
  const failed = daily.reduce((sum, item) => sum + item.failed, 0)
  const byDifficulty = daily.reduce(
    (acc, item) => ({
      Easy: acc.Easy + item.byDifficulty.Easy,
      Normal: acc.Normal + item.byDifficulty.Normal,
      Hard: acc.Hard + item.byDifficulty.Hard,
    }),
    { Easy: 0, Normal: 0, Hard: 0 }
  )

  return {
    days,
    completed,
    failed,
    completionPercent: toPercent(completed, completed + failed),
    byDifficulty,
    daily,
  }
}

export const buildDailyHistory = ({
  habits = [],
  quests = [],
  rewardLog = [],
  dailyHistory = {},
  days = 90,
  endDate = new Date(),
} = {}) => {
  const keys = getDateRangeKeys(days, endDate)
  const totalHabits = habits.length
  const map = {}

  const historyKeys = new Set(Object.keys(dailyHistory || {}))

  keys.forEach((key) => {
    map[key] = buildEmptyDay(key, totalHabits)
  })

  Object.entries(dailyHistory || {}).forEach(([dateKey, row]) => {
    if (!map[dateKey]) return
    map[dateKey] = normalizeDayRecord(dateKey, row, totalHabits)
  })

  habits.forEach((habit) => {
    const xpReward = Math.max(0, numberOrZero(habit.xpReward) || 25)
    Object.entries(habit.history || {}).forEach(([dateKey, count]) => {
      if (!map[dateKey] || historyKeys.has(dateKey)) return
      const done = numberOrZero(count) > 0 ? 1 : 0
      map[dateKey].habitsDone += done
      map[dateKey].xpGained += done * xpReward
    })
  })

  quests.forEach((quest) => {
    const completedDate = getQuestEventDate(quest, 'completed')
    const failedDate = getQuestEventDate(quest, 'failed')
    if (completedDate && map[completedDate] && !historyKeys.has(completedDate)) {
      map[completedDate].questsDone += 1
      map[completedDate].xpGained += Math.max(0, numberOrZero(quest.xp))
      map[completedDate].goldGained += Math.max(0, numberOrZero(quest.gold))
    }
    if (failedDate && map[failedDate] && !historyKeys.has(failedDate)) {
      map[failedDate].questsFailed += 1
      map[failedDate].xpLost += Math.max(0, numberOrZero(quest.xp))
    }
  })

  rewardLog.forEach((entry) => {
    const dateKey = toDateKey(entry.at)
    if (!dateKey || !map[dateKey] || historyKeys.has(dateKey)) return
    map[dateKey].goldSpent += Math.max(0, numberOrZero(entry.cost))
  })

  keys.forEach((dateKey) => {
    const row = map[dateKey]
    if (!row) return
    row.habitsMissed = Math.max(0, row.totalHabits - row.habitsDone)
    row.perfectDay = row.habitsMissed === 0 && row.questsFailed === 0 && row.totalHabits > 0
  })

  return keys
    .map((key) => map[key])
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const getDisciplineMetrics = (historyRows = [], endDate = new Date()) => {
  const targetDate = toDateKey(endDate)
  const asc = [...historyRows].sort((a, b) => (a.date > b.date ? 1 : -1))
  const onlyPast = asc.filter((row) => row.date <= targetDate)
  const keys = onlyPast.map((row) => row.date)
  const byDate = Object.fromEntries(onlyPast.map((row) => [row.date, row]))

  const dayPasses = (dateKey) => {
    const row = byDate[dateKey]
    if (!row) return false
    const habitsComplete = row.totalHabits === 0 || row.habitsMissed === 0
    return habitsComplete && row.questsFailed === 0
  }

  const dayMissed = (dateKey) => !dayPasses(dateKey)
  const currentStreak = trailingRun(keys, dayPasses)
  const longestStreak = longestRun(keys, dayPasses)
  const daysMissedTotal = keys.filter(dayMissed).length
  const perfectDaysCount = keys.filter((dateKey) => byDate[dateKey]?.perfectDay).length
  const today = byDate[targetDate]
  const atRisk = Boolean(today && (today.habitsMissed > 0 || today.questsFailed > 0))

  return {
    currentStreak,
    longestStreak,
    daysMissedTotal,
    perfectDaysCount,
    atRisk,
  }
}

export const buildPerformanceSeries = ({
  historyRows = [],
  days = 7,
  endDate = new Date(),
} = {}) => {
  const keys = getDateRangeKeys(days, endDate)
  const map = Object.fromEntries((historyRows || []).map((row) => [row.date, row]))
  const mode = days <= 7 ? 'weekly' : 'monthly'

  return keys.map((dateKey) => {
    const row = map[dateKey] || buildEmptyDay(dateKey, 0)
    const habitTotal = row.habitsDone + row.habitsMissed
    const questTotal = row.questsDone + row.questsFailed
    return {
      date: dateKey,
      label: formatDateLabel(dateKey, mode),
      xpGained: row.xpGained,
      xpLost: row.xpLost,
      habitsDone: row.habitsDone,
      habitsMissed: row.habitsMissed,
      questsDone: row.questsDone,
      questsFailed: row.questsFailed,
      habitsCompletionPercent: toPercent(row.habitsDone, habitTotal),
      questsCompletionPercent: toPercent(row.questsDone, questTotal),
    }
  })
}

export const buildProfileAnalytics = ({
  state = {},
  quests = [],
  habits = [],
  rewardLog = [],
  endDate = new Date(),
} = {}) => {
  const firstUseAt = resolveFirstUseDate({
    state,
    quests,
    habits,
    rewardLog,
    dailyHistory: state.dailyHistory || {},
  })
  const todayKey = toDateKey(endDate)
  const habitToday = getHabitDayStats(habits, todayKey)
  const habitWeek = getHabitRangeStats(habits, 7, endDate)
  const habitMonth = getHabitMonthlyStats(habits, endDate)
  const questToday = getQuestDayStats(quests, todayKey)
  const questWeek = getQuestRangeStats(quests, 7, endDate)
  const history = buildDailyHistory({
    habits,
    quests,
    rewardLog,
    dailyHistory: state.dailyHistory || {},
    days: 120,
    endDate,
  })
  const discipline = getDisciplineMetrics(history, endDate)

  return {
    identity: {
      accountAgeDays: getAccountAgeDays(firstUseAt, endDate),
      firstUseAt,
    },
    habits: {
      today: habitToday,
      week: habitWeek,
      month: habitMonth,
    },
    quests: {
      today: questToday,
      week: questWeek,
    },
    discipline,
    history,
    trends: {
      sevenDay: buildPerformanceSeries({ historyRows: history, days: 7, endDate }),
      thirtyDay: buildPerformanceSeries({ historyRows: history, days: 30, endDate }),
    },
  }
}

