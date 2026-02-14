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

const suggestionForTask = (taskTitle = '') => {
  const title = String(taskTitle).toLowerCase()
  if (title.includes('meditation')) {
    return 'You struggle with meditation; try a 2-minute breathing round before increasing duration.'
  }
  if (title.includes('communication')) {
    return 'Communication is slipping; schedule one short speaking drill immediately after class.'
  }
  if (title.includes('workout') || title.includes('walk')) {
    return 'Movement consistency is low; set a non-negotiable minimum like 10 minutes today.'
  }
  if (title.includes('leetcode') || title.includes('pyq')) {
    return 'Study execution is inconsistent; start with one easy warm-up before the main block.'
  }
  return 'This task is being skipped often; lower friction and lock a fixed start time tomorrow.'
}

export const gradeFromPercent = (percent) => {
  const safe = clampPercent(percent)
  if (safe >= 100) return 'S'
  if (safe >= 80) return 'A'
  if (safe >= 60) return 'B'
  if (safe >= 40) return 'C'
  return 'F'
}

export const gradeToScore = (grade) => {
  const value = String(grade || '').toUpperCase()
  if (value === 'S') return 5
  if (value === 'A') return 4
  if (value === 'B') return 3
  if (value === 'C') return 2
  return 1
}

export const scoreToGrade = (score) => {
  const safe = Math.round(numberOrZero(score))
  if (safe >= 5) return 'S'
  if (safe >= 4) return 'A'
  if (safe >= 3) return 'B'
  if (safe >= 2) return 'C'
  return 'F'
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

export const getDisciplineMetrics = (
  historyRows = [],
  endDate = new Date(),
  startDate = ''
) => {
  const targetDate = toDateKey(endDate)
  const startKey = toDateKey(startDate)
  const asc = [...historyRows].sort((a, b) => (a.date > b.date ? 1 : -1))
  const onlyPast = asc.filter((row) => {
    if (row.date > targetDate) return false
    if (startKey && row.date < startKey) return false
    return true
  })
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

export const buildTodayTaskSnapshot = ({
  habits = [],
  quests = [],
  dailyHistory = {},
  date = new Date(),
  settings = {},
} = {}) => {
  const dateKey = toDateKey(date)
  const hour = date.getHours()

  const habitTasks = habits.map((habit) => {
    const done = numberOrZero((habit.history || {})[dateKey]) > 0
    return {
      id: habit.id,
      type: 'habit',
      title: habit.title,
      status: done ? 'completed' : 'pending',
      xpReward: numberOrZero(habit.xpReward),
    }
  })

  const questTasks = quests.map((quest) => {
    const completedToday = toDateKey(quest.completedAt) === dateKey
    const failedToday = toDateKey(quest.failedAt) === dateKey
    return {
      id: quest.id,
      type: 'quest',
      title: quest.title,
      status: completedToday ? 'completed' : failedToday ? 'failed' : 'pending',
      difficulty: normalizeDifficulty(quest.difficulty),
      xpReward: numberOrZero(quest.xp),
      goldReward: numberOrZero(quest.gold),
    }
  })

  const tasks = [...habitTasks, ...questTasks]
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((item) => item.status === 'completed').length
  const failedTasks = tasks.filter((item) => item.status === 'failed').length
  const pendingTasks = Math.max(0, totalTasks - completedTasks)
  const completionPercent = toPercent(completedTasks, totalTasks)
  const grade = gradeFromPercent(completionPercent)
  const historyRow = normalizeDayRecord(dateKey, dailyHistory[dateKey], habits.length)

  const warningsEnabled = settings.streakWarnings !== false
  const atRisk = Boolean(warningsEnabled && hour >= 19 && pendingTasks > 0)

  return {
    date: dateKey,
    tasks,
    totalTasks,
    completedTasks,
    failedTasks,
    pendingTasks,
    completionPercent,
    grade,
    xpGained: historyRow.xpGained,
    xpLost: historyRow.xpLost,
    goldGained: historyRow.goldGained,
    goldSpent: historyRow.goldSpent,
    atRisk,
    warningMessage: atRisk
      ? 'Streak risk: it is after 7 PM and some tasks are still incomplete.'
      : '',
  }
}

export const buildWeeklyPerformance = ({
  historyRows = [],
  gradingHistory = {},
  endDate = new Date(),
} = {}) => {
  const keys = getDateRangeKeys(7, endDate)
  const historyByDate = Object.fromEntries((historyRows || []).map((row) => [row.date, row]))
  const gradeByDate = gradingHistory || {}

  const daily = keys.map((dateKey) => {
    const history = historyByDate[dateKey] || buildEmptyDay(dateKey, 0)
    const gradeRow = gradeByDate[dateKey] || {}
    const tasksCompleted = numberOrZero(gradeRow.tasksCompleted)
      || numberOrZero(history.habitsDone + history.questsDone)
    const fallbackTotal = numberOrZero(history.totalHabits + history.questsDone + history.questsFailed)
    const tasksTotal = numberOrZero(gradeRow.tasksTotal) || fallbackTotal
    const completionPercent = numberOrZero(gradeRow.completionPercent)
      || toPercent(tasksCompleted, tasksTotal)
    const grade = gradeRow.grade || gradeFromPercent(completionPercent)

    return {
      date: dateKey,
      label: formatDateLabel(dateKey, 'weekly'),
      tasksCompleted,
      tasksTotal,
      completionPercent,
      grade,
      gradeScore: gradeToScore(grade),
      xpGained: numberOrZero(history.xpGained),
      goldGained: numberOrZero(history.goldGained),
    }
  })

  const totalTasksCompleted = daily.reduce((sum, row) => sum + row.tasksCompleted, 0)
  const weeklyXP = daily.reduce((sum, row) => sum + row.xpGained, 0)
  const averageCompletion = toPercent(
    daily.reduce((sum, row) => sum + row.completionPercent, 0),
    daily.length * 100
  )

  const bestDay = [...daily].sort((a, b) => b.completionPercent - a.completionPercent)[0] || null
  const worstDay = [...daily].sort((a, b) => a.completionPercent - b.completionPercent)[0] || null

  return {
    daily,
    totalTasksCompleted,
    weeklyXP,
    averageCompletion,
    bestDay,
    worstDay,
  }
}

export const buildHabitPatternStats = ({
  habits = [],
  days = 30,
  endDate = new Date(),
} = {}) => {
  const keys = getDateRangeKeys(days, endDate)
  if (!keys.length || !habits.length) {
    return {
      chartData: [],
      mostCompleted: null,
      mostSkipped: null,
    }
  }

  const chartData = habits.map((habit) => {
    const done = keys.reduce(
      (sum, key) => sum + (numberOrZero((habit.history || {})[key]) > 0 ? 1 : 0),
      0
    )
    const skipped = Math.max(0, keys.length - done)
    return {
      id: habit.id,
      title: habit.title,
      completed: done,
      skipped,
      completionRate: toPercent(done, keys.length),
    }
  })

  const mostCompleted = [...chartData].sort((a, b) => b.completed - a.completed)[0] || null
  const mostSkipped = [...chartData].sort((a, b) => b.skipped - a.skipped)[0] || null

  return {
    chartData,
    mostCompleted,
    mostSkipped,
  }
}

export const buildBehaviorInsight = ({
  habitPatternStats = {},
} = {}) => {
  const mostSkipped = habitPatternStats.mostSkipped
  if (!mostSkipped) {
    return {
      title: 'No Skip Pattern Yet',
      message: 'Keep logging daily progress to unlock behavior insights.',
      severity: 'low',
      taskId: '',
    }
  }

  const severity = mostSkipped.skipped >= 10 ? 'high' : mostSkipped.skipped >= 5 ? 'medium' : 'low'

  return {
    title: 'Behavior Insight',
    message: suggestionForTask(mostSkipped.title),
    severity,
    taskId: mostSkipped.id,
    taskTitle: mostSkipped.title,
    skippedCount: mostSkipped.skipped,
  }
}

export const upsertDailyGrade = (gradingHistory = {}, summary = {}) => {
  const dateKey = summary.date || toDateKey(new Date())
  return {
    ...gradingHistory,
    [dateKey]: {
      date: dateKey,
      grade: summary.grade || gradeFromPercent(summary.completionPercent),
      completionPercent: clampPercent(summary.completionPercent),
      tasksCompleted: numberOrZero(summary.completedTasks),
      tasksTotal: numberOrZero(summary.totalTasks),
      xpGained: numberOrZero(summary.xpGained),
      goldGained: numberOrZero(summary.goldGained),
      atRisk: Boolean(summary.atRisk),
      updatedAt: new Date().toISOString(),
    },
  }
}

export const upsertAnalyticsLog = (analyticsLog = [], summary = {}, limit = 120) => {
  const dateKey = summary.date || toDateKey(new Date())
  const next = [
    {
      date: dateKey,
      completionPercent: clampPercent(summary.completionPercent),
      grade: summary.grade || gradeFromPercent(summary.completionPercent),
      tasksCompleted: numberOrZero(summary.completedTasks),
      tasksTotal: numberOrZero(summary.totalTasks),
      xpGained: numberOrZero(summary.xpGained),
      xpLost: numberOrZero(summary.xpLost),
      goldGained: numberOrZero(summary.goldGained),
      goldSpent: numberOrZero(summary.goldSpent),
      completedTaskIds: (summary.tasks || [])
        .filter((task) => task.status === 'completed')
        .map((task) => task.id),
      skippedTaskIds: (summary.tasks || [])
        .filter((task) => task.status !== 'completed')
        .map((task) => task.id),
      updatedAt: new Date().toISOString(),
    },
    ...(analyticsLog || []).filter((entry) => entry.date !== dateKey),
  ]

  return next.slice(0, limit)
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
  const accountAgeDays = getAccountAgeDays(firstUseAt, endDate)
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
    days: Math.max(1, accountAgeDays),
    endDate,
  })
  const discipline = getDisciplineMetrics(history, endDate, firstUseAt)
  const habitPatternStats = buildHabitPatternStats({ habits, days: 30, endDate })
  const behaviorInsight = buildBehaviorInsight({ habitPatternStats })
  const weeklyPerformance = buildWeeklyPerformance({
    historyRows: history,
    gradingHistory: state.gradingHistory || {},
    endDate,
  })

  return {
    identity: {
      accountAgeDays,
      firstUseAt,
    },
    habits: {
      today: habitToday,
      week: habitWeek,
      month: habitMonth,
      pattern: habitPatternStats,
    },
    quests: {
      today: questToday,
      week: questWeek,
    },
    discipline,
    history,
    behaviorInsight,
    weeklyPerformance,
    trends: {
      sevenDay: buildPerformanceSeries({ historyRows: history, days: 7, endDate }),
      thirtyDay: buildPerformanceSeries({ historyRows: history, days: 30, endDate }),
    },
  }
}
