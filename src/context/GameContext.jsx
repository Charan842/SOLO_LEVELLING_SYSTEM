import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  buildDailyHistory,
  getAccountAgeDays,
  getDisciplineMetrics,
  resolveFirstUseDate,
  toDateKey,
} from '../utils/analytics'
import { rankFromLevel } from '../utils/rankSystem'
import { applyXpChange, xpForNextLevel } from '../utils/xpSystem'
import { readStorage, readString, writeStorage, writeString } from '../utils/storage'

const STORAGE_KEY = 'solo_leveling_state_v1'
const ROLLOVER_KEY = 'solo_leveling_last_rollover_v1'
const QUESTS_KEY = 'solo_leveling_quests_v1'
const HABITS_KEY = 'solo_leveling_habits_v1'
const REWARD_LOG_KEY = 'solo_leveling_reward_log_v1'
const MAX_HISTORY_WINDOW_DAYS = 3650

const DEFAULT_PROFILE = {
  playerName: 'Hunter',
  title: 'Shadow Trainee',
}

const DEFAULT_SETTINGS = {
  xpMultiplier: 1,
  penaltySeverity: 'Medium',
  dailyXpCapEnabled: false,
  dailyXpCap: 500,
  habitPenalties: true,
  streakResetOnMiss: true,
  habitReminder: false,
  questPenalties: true,
  autoFailOverdueQuests: true,
  darkMode: true,
  glowIntensity: 70,
  reduceAnimations: false,
}

const penaltyBySeverity = {
  Low: 0.5,
  Medium: 1,
  High: 1.5,
}

const GameContext = createContext(null)

const clampNumber = (value, fallback = 0) => {
  const number = Number(value)
  if (Number.isNaN(number)) return fallback
  return number
}

const clampInt = (value, min, max) =>
  Math.min(max, Math.max(min, Math.round(clampNumber(value, min))))

const normalizeSeverity = (value) => {
  const label = String(value || '')
  if (label === 'Low' || label === 'High' || label === 'Medium') return label
  return 'Medium'
}

const normalizeProfile = (profile = {}) => ({
  playerName: String(profile.playerName || DEFAULT_PROFILE.playerName).trim() || DEFAULT_PROFILE.playerName,
  title: String(profile.title || DEFAULT_PROFILE.title).trim() || DEFAULT_PROFILE.title,
})

const normalizeSettings = (settings = {}) => ({
  xpMultiplier: Math.max(0.5, Math.min(2, clampNumber(settings.xpMultiplier, DEFAULT_SETTINGS.xpMultiplier))),
  penaltySeverity: normalizeSeverity(settings.penaltySeverity || DEFAULT_SETTINGS.penaltySeverity),
  dailyXpCapEnabled: Boolean(settings.dailyXpCapEnabled),
  dailyXpCap: Math.max(0, clampInt(settings.dailyXpCap, 0, 5000)),
  habitPenalties:
    settings.habitPenalties === undefined ? DEFAULT_SETTINGS.habitPenalties : Boolean(settings.habitPenalties),
  streakResetOnMiss:
    settings.streakResetOnMiss === undefined
      ? DEFAULT_SETTINGS.streakResetOnMiss
      : Boolean(settings.streakResetOnMiss),
  habitReminder:
    settings.habitReminder === undefined ? DEFAULT_SETTINGS.habitReminder : Boolean(settings.habitReminder),
  questPenalties:
    settings.questPenalties === undefined ? DEFAULT_SETTINGS.questPenalties : Boolean(settings.questPenalties),
  autoFailOverdueQuests:
    settings.autoFailOverdueQuests === undefined
      ? DEFAULT_SETTINGS.autoFailOverdueQuests
      : Boolean(settings.autoFailOverdueQuests),
  darkMode: settings.darkMode === undefined ? DEFAULT_SETTINGS.darkMode : Boolean(settings.darkMode),
  glowIntensity: clampInt(settings.glowIntensity, 0, 100),
  reduceAnimations:
    settings.reduceAnimations === undefined
      ? DEFAULT_SETTINGS.reduceAnimations
      : Boolean(settings.reduceAnimations),
})

const normalizeHistoryRow = (row = {}) => ({
  xpGained: Math.max(0, clampNumber(row.xpGained, 0)),
  xpLost: Math.max(0, clampNumber(row.xpLost, 0)),
  goldGained: Math.max(0, clampNumber(row.goldGained, 0)),
  goldSpent: Math.max(0, clampNumber(row.goldSpent, 0)),
  habitsDone: Math.max(0, clampNumber(row.habitsDone, 0)),
  habitsMissed: Math.max(0, clampNumber(row.habitsMissed, 0)),
  questsDone: Math.max(0, clampNumber(row.questsDone, 0)),
  questsFailed: Math.max(0, clampNumber(row.questsFailed, 0)),
  totalHabits: Math.max(0, clampNumber(row.totalHabits, 0)),
  perfectDay: Boolean(row.perfectDay),
})

const mergeDailyHistory = (dailyHistory = {}, dateKey, patch = {}) => {
  const base = normalizeHistoryRow(dailyHistory[dateKey])
  const next = normalizeHistoryRow({
    ...base,
    ...patch,
    xpGained: base.xpGained + Math.max(0, clampNumber(patch.xpGainedDelta, 0)),
    xpLost: base.xpLost + Math.max(0, clampNumber(patch.xpLostDelta, 0)),
    goldGained: base.goldGained + Math.max(0, clampNumber(patch.goldGainedDelta, 0)),
    goldSpent: base.goldSpent + Math.max(0, clampNumber(patch.goldSpentDelta, 0)),
    habitsDone: base.habitsDone + Math.max(0, clampNumber(patch.habitsDoneDelta, 0)),
    habitsMissed: base.habitsMissed + Math.max(0, clampNumber(patch.habitsMissedDelta, 0)),
    questsDone: base.questsDone + Math.max(0, clampNumber(patch.questsDoneDelta, 0)),
    questsFailed: base.questsFailed + Math.max(0, clampNumber(patch.questsFailedDelta, 0)),
  })

  return {
    ...dailyHistory,
    [dateKey]: next,
  }
}

const totalAbsoluteXp = (level, xp) => {
  const safeLevel = Math.max(1, clampInt(level, 1, 100000))
  const safeXp = Math.max(0, clampNumber(xp, 0))
  let total = safeXp
  for (let next = 1; next < safeLevel; next += 1) {
    total += xpForNextLevel(next)
  }
  return total
}

const applyXpDelta = (state, delta) => {
  const next = applyXpChange({ xp: state.xp, level: state.level }, delta)
  return { ...state, ...next, rank: rankFromLevel(next.level) }
}

const createDefaultState = () => {
  const now = new Date().toISOString()
  return {
    historyVersion: 2,
    xp: 0,
    level: 1,
    gold: 0,
    streak: 0,
    rank: 'E',
    firstUseAt: now,
    totalXPEarned: 0,
    totalXPLost: 0,
    totalGoldEarned: 0,
    totalGoldSpent: 0,
    longestStreak: 0,
    daysMissedTotal: 0,
    perfectDaysCount: 0,
    dailyHistory: {},
    profile: DEFAULT_PROFILE,
    settings: DEFAULT_SETTINGS,
  }
}

const loadState = () => {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  const parsed = readStorage(STORAGE_KEY, null)
  if (!parsed) return createDefaultState()

  const level = Math.max(1, clampInt(parsed.level, 1, 100000))
  const xp = Math.max(0, clampNumber(parsed.xp, 0))
  const gold = Math.max(0, clampNumber(parsed.gold, 0))
  const streak = Math.max(0, clampInt(parsed.streak, 0, 100000))
  const rank = rankFromLevel(level)
  const absoluteXp = totalAbsoluteXp(level, xp)

  const quests = readStorage(QUESTS_KEY, [])
  const habits = readStorage(HABITS_KEY, [])
  const rewardLog = readStorage(REWARD_LOG_KEY, [])

  const firstUseAt =
    parsed.firstUseAt ||
    resolveFirstUseDate({
      state: parsed,
      quests,
      habits,
      rewardLog,
      dailyHistory: parsed.dailyHistory || {},
    })

  const parsedHistoryVersion = clampInt(parsed.historyVersion, 0, 99)
  const safeDailyHistory =
    parsedHistoryVersion >= 2
      ? Object.fromEntries(
          Object.entries(parsed.dailyHistory || {}).map(([dateKey, row]) => [
            dateKey,
            normalizeHistoryRow(row),
          ])
        )
      : {}

  return {
    historyVersion: 2,
    xp,
    level,
    gold,
    streak,
    rank,
    firstUseAt,
    totalXPEarned: Math.max(absoluteXp, clampNumber(parsed.totalXPEarned, absoluteXp)),
    totalXPLost: Math.max(0, clampNumber(parsed.totalXPLost, 0)),
    totalGoldEarned: Math.max(gold, clampNumber(parsed.totalGoldEarned, gold)),
    totalGoldSpent: Math.max(0, clampNumber(parsed.totalGoldSpent, 0)),
    longestStreak: Math.max(streak, clampInt(parsed.longestStreak, streak, 100000)),
    daysMissedTotal: Math.max(0, clampInt(parsed.daysMissedTotal, 0, 100000)),
    perfectDaysCount: Math.max(0, clampInt(parsed.perfectDaysCount, 0, 100000)),
    dailyHistory: safeDailyHistory,
    profile: normalizeProfile(parsed.profile),
    settings: normalizeSettings(parsed.settings),
  }
}

const syncHistoryAndDiscipline = (prevState) => {
  if (typeof window === 'undefined') return prevState

  const quests = readStorage(QUESTS_KEY, [])
  const habits = readStorage(HABITS_KEY, [])
  const rewardLog = readStorage(REWARD_LOG_KEY, [])
  const now = new Date()
  const firstUseAt =
    prevState.firstUseAt ||
    resolveFirstUseDate({
      state: prevState,
      quests,
      habits,
      rewardLog,
      dailyHistory: prevState.dailyHistory,
    })
  const historyWindowDays = Math.max(
    1,
    Math.min(MAX_HISTORY_WINDOW_DAYS, getAccountAgeDays(firstUseAt, now))
  )

  const historyRows = buildDailyHistory({
    habits,
    quests,
    rewardLog,
    dailyHistory: prevState.dailyHistory || {},
    days: historyWindowDays,
    endDate: now,
  })

  const discipline = getDisciplineMetrics(historyRows, now, firstUseAt)

  return {
    ...prevState,
    firstUseAt,
    longestStreak: Math.max(prevState.longestStreak || 0, prevState.streak || 0, discipline.longestStreak),
    daysMissedTotal: discipline.daysMissedTotal,
    perfectDaysCount: discipline.perfectDaysCount,
  }
}

const applyXpTransaction = (prevState, requestedDelta, options = {}) => {
  const dateKey = options.dateKey || toDateKey(new Date())
  const settings = normalizeSettings(prevState.settings)
  let delta = clampNumber(requestedDelta, 0)

  if (delta > 0) {
    if (!options.ignoreMultiplier) {
      delta *= settings.xpMultiplier
    }
    delta = Math.max(0, Math.round(delta))

    if (!options.ignoreDailyCap && settings.dailyXpCapEnabled) {
      const cap = Math.max(0, clampNumber(settings.dailyXpCap, 0))
      const todayHistory = normalizeHistoryRow((prevState.dailyHistory || {})[dateKey])
      const remaining = Math.max(0, cap - todayHistory.xpGained)
      delta = Math.min(delta, remaining)
    }
  } else if (delta < 0) {
    let loss = Math.abs(delta)
    if (!options.ignorePenaltyScale) {
      loss *= penaltyBySeverity[settings.penaltySeverity] || 1
    }
    delta = -Math.max(0, Math.round(loss))
  }

  if (!delta) return prevState

  const beforeAbsolute = totalAbsoluteXp(prevState.level, prevState.xp)
  const withXp = applyXpDelta(prevState, delta)
  const afterAbsolute = totalAbsoluteXp(withXp.level, withXp.xp)
  const appliedDelta = afterAbsolute - beforeAbsolute

  if (!appliedDelta) return prevState

  let nextState = {
    ...withXp,
    totalXPEarned:
      prevState.totalXPEarned + (options.countTotals === false ? 0 : Math.max(0, appliedDelta)),
    totalXPLost:
      prevState.totalXPLost + (options.countTotals === false ? 0 : Math.max(0, -appliedDelta)),
    longestStreak: Math.max(prevState.longestStreak || 0, prevState.streak || 0),
  }

  if (options.trackHistory) {
    nextState = {
      ...nextState,
      dailyHistory: mergeDailyHistory(prevState.dailyHistory, dateKey, {
        xpGainedDelta: Math.max(0, appliedDelta),
        xpLostDelta: Math.max(0, -appliedDelta),
        ...(options.historyPatch || {}),
      }),
    }
  }

  return nextState
}

const applyGoldTransaction = (prevState, requestedDelta, options = {}) => {
  const dateKey = options.dateKey || toDateKey(new Date())
  const delta = clampNumber(requestedDelta, 0)
  if (!delta) return prevState

  let appliedDelta = delta
  if (delta < 0) {
    const available = Math.max(0, clampNumber(prevState.gold, 0))
    const spend = Math.min(available, Math.abs(delta))
    appliedDelta = -spend
  }

  if (!appliedDelta) return prevState

  const nextGold = Math.max(0, clampNumber(prevState.gold, 0) + appliedDelta)
  let nextState = {
    ...prevState,
    gold: nextGold,
    totalGoldEarned:
      prevState.totalGoldEarned + (options.countTotals === false ? 0 : Math.max(0, appliedDelta)),
    totalGoldSpent:
      prevState.totalGoldSpent + (options.countTotals === false ? 0 : Math.max(0, -appliedDelta)),
  }

  if (options.trackHistory) {
    nextState = {
      ...nextState,
      dailyHistory: mergeDailyHistory(prevState.dailyHistory, dateKey, {
        goldGainedDelta: Math.max(0, appliedDelta),
        goldSpentDelta: Math.max(0, -appliedDelta),
        ...(options.historyPatch || {}),
      }),
    }
  }

  return nextState
}

export function GameProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    if (typeof window === 'undefined') return
    writeStorage(STORAGE_KEY, state)
  }, [state])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const sync = () => {
      setState((prev) => syncHistoryAndDiscipline(prev))
    }

    sync()
    const timer = setInterval(sync, 15 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const runRollover = () => {
      const today = toDateKey(new Date())
      const last = readString(ROLLOVER_KEY, '')
      if (last === today) return

      const nowIso = new Date().toISOString()
      const todaySettings = normalizeSettings(state.settings)

      let xpPenalty = 0
      let failedCount = 0

      const quests = readStorage(QUESTS_KEY, [])
      if (todaySettings.autoFailOverdueQuests) {
        let questChanged = false
        const updatedQuests = quests.map((quest) => {
          if (quest.status !== 'active') return quest
          if (!quest.deadline) return quest
          if (quest.deadline >= today) return quest

          questChanged = true
          failedCount += 1
          xpPenalty += Math.max(0, clampNumber(quest.xp, 0))

          return {
            ...quest,
            status: 'failed',
            failedAt: nowIso,
            updatedAt: nowIso,
          }
        })

        if (questChanged) {
          writeStorage(QUESTS_KEY, updatedQuests)
        }
      }

      if (todaySettings.streakResetOnMiss) {
        const habits = readStorage(HABITS_KEY, [])
        let habitChanged = false
        const updatedHabits = habits.map((habit) => {
          if (!habit.lastCompleted) return habit

          const lastDate = new Date(habit.lastCompleted)
          if (Number.isNaN(lastDate.getTime())) return habit

          const diffDays = Math.floor(
            (new Date(`${today}T00:00:00.000Z`) - lastDate) / (1000 * 60 * 60 * 24)
          )

          if (diffDays <= 1) return habit

          habitChanged = true
          return {
            ...habit,
            streak: 0,
            updatedAt: nowIso,
          }
        })

        if (habitChanged) {
          writeStorage(HABITS_KEY, updatedHabits)
        }
      }

      if (xpPenalty > 0 && todaySettings.questPenalties) {
        setState((prev) =>
          applyXpTransaction(prev, -xpPenalty, {
            ignorePenaltyScale: true,
            ignoreDailyCap: true,
            ignoreMultiplier: true,
            trackHistory: true,
            dateKey: today,
            historyPatch: { questsFailedDelta: failedCount },
          })
        )
      }

      writeString(ROLLOVER_KEY, today)
      setState((prev) => syncHistoryAndDiscipline(prev))
    }

    runRollover()
    const timer = setInterval(runRollover, 60 * 60 * 1000)
    return () => clearInterval(timer)
  }, [state.settings])

  const addXP = (amount, meta = {}) => {
    const value = clampNumber(amount, 0)
    if (value <= 0) return
    setState((prev) =>
      applyXpTransaction(prev, value, {
        trackHistory: Boolean(meta.trackHistory),
        historyPatch: meta.historyPatch,
        dateKey: meta.dateKey,
        ignoreMultiplier: Boolean(meta.ignoreMultiplier),
        ignoreDailyCap: Boolean(meta.ignoreDailyCap),
        countTotals: meta.countTotals,
      })
    )
  }

  const removeXP = (amount, meta = {}) => {
    const value = clampNumber(amount, 0)
    if (value <= 0) return

    const settings = normalizeSettings(state.settings)
    if (meta.source === 'habit' && !settings.habitPenalties && !meta.forcePenalty) return
    if (meta.source === 'quest' && !settings.questPenalties && !meta.forcePenalty) return

    setState((prev) =>
      applyXpTransaction(prev, -value, {
        trackHistory: Boolean(meta.trackHistory),
        historyPatch: meta.historyPatch,
        dateKey: meta.dateKey,
        ignorePenaltyScale: Boolean(meta.ignorePenaltyScale),
        countTotals: meta.countTotals,
      })
    )
  }

  const addGold = (amount, meta = {}) => {
    const value = clampNumber(amount, 0)
    if (value <= 0) return
    setState((prev) =>
      applyGoldTransaction(prev, value, {
        trackHistory: Boolean(meta.trackHistory),
        historyPatch: meta.historyPatch,
        dateKey: meta.dateKey,
        countTotals: meta.countTotals,
      })
    )
  }

  const spendGold = (amount, meta = {}) => {
    const value = clampNumber(amount, 0)
    if (value <= 0) return
    setState((prev) =>
      applyGoldTransaction(prev, -value, {
        trackHistory: Boolean(meta.trackHistory),
        historyPatch: meta.historyPatch,
        dateKey: meta.dateKey,
        countTotals: meta.countTotals,
      })
    )
  }

  const setStreak = (value) => {
    const next = Math.max(0, clampInt(value, 0, 100000))
    setState((prev) => ({
      ...prev,
      streak: next,
      longestStreak: Math.max(prev.longestStreak || 0, next),
    }))
  }

  const incrementStreak = () => {
    setState((prev) => {
      const nextStreak = (prev.streak || 0) + 1
      return {
        ...prev,
        streak: nextStreak,
        longestStreak: Math.max(prev.longestStreak || 0, nextStreak),
      }
    })
  }

  const resetStreak = () => {
    setState((prev) => ({ ...prev, streak: 0 }))
  }

  const updateProfile = (patch = {}) => {
    setState((prev) => ({
      ...prev,
      profile: normalizeProfile({ ...prev.profile, ...patch }),
    }))
  }

  const updateSettings = (patch = {}) => {
    setState((prev) => ({
      ...prev,
      settings: normalizeSettings({ ...prev.settings, ...patch }),
    }))
  }

  const resetAllData = () => {
    const base = createDefaultState()
    setState(base)

    if (typeof window === 'undefined') return
    writeStorage(QUESTS_KEY, [])
    writeStorage(HABITS_KEY, [])
    window.localStorage.removeItem('solo_leveling_rewards_v1')
    window.localStorage.removeItem(REWARD_LOG_KEY)
    writeString('solo_leveling_focus_v1', '')
    writeString(ROLLOVER_KEY, toDateKey(new Date()))
  }

  const nextLevelXP = useMemo(() => xpForNextLevel(state.level), [state.level])
  const xpPercent = useMemo(() => {
    if (nextLevelXP === 0) return 0
    return Math.min(100, Math.round((state.xp / nextLevelXP) * 100))
  }, [state.xp, nextLevelXP])

  const value = {
    xp: state.xp,
    level: state.level,
    rank: state.rank,
    gold: state.gold,
    streak: state.streak,
    nextLevelXP,
    xpPercent,
    firstUseAt: state.firstUseAt,
    totalXPEarned: state.totalXPEarned,
    totalXPLost: state.totalXPLost,
    totalGoldEarned: state.totalGoldEarned,
    totalGoldSpent: state.totalGoldSpent,
    longestStreak: state.longestStreak,
    daysMissedTotal: state.daysMissedTotal,
    perfectDaysCount: state.perfectDaysCount,
    dailyHistory: state.dailyHistory,
    profile: state.profile,
    settings: state.settings,
    addXP,
    removeXP,
    addGold,
    spendGold,
    setStreak,
    incrementStreak,
    resetStreak,
    updateProfile,
    updateSettings,
    resetAllData,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
