import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { rankFromLevel } from '../utils/rankSystem'
import { applyXpChange, xpForNextLevel } from '../utils/xpSystem'
import { readStorage, readString, writeStorage, writeString } from '../utils/storage'

const STORAGE_KEY = 'solo_leveling_state_v1'
const ROLLOVER_KEY = 'solo_leveling_last_rollover_v1'

const clampNumber = (value, fallback = 0) => {
  const number = Number(value)
  if (Number.isNaN(number)) return fallback
  return number
}

const loadState = () => {
  if (typeof window === 'undefined') {
    return { xp: 0, level: 1, gold: 0, streak: 0, rank: 'E' }
  }

  try {
    const parsed = readStorage(STORAGE_KEY, null)
    if (!parsed) return { xp: 0, level: 1, gold: 0, streak: 0, rank: 'E' }
    const level = Math.max(1, clampNumber(parsed.level, 1))
    const xp = Math.max(0, clampNumber(parsed.xp, 0))
    const gold = Math.max(0, clampNumber(parsed.gold, 0))
    const streak = Math.max(0, clampNumber(parsed.streak, 0))
    const rank = rankFromLevel(level)
    return { xp, level, gold, streak, rank }
  } catch (error) {
    return { xp: 0, level: 1, gold: 0, streak: 0, rank: 'E' }
  }
}

const GameContext = createContext(null)

const applyXpDelta = (state, delta) => {
  const next = applyXpChange({ xp: state.xp, level: state.level }, delta)
  return { ...state, ...next, rank: rankFromLevel(next.level) }
}

export function GameProvider({ children }) {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    if (typeof window === 'undefined') return
    writeStorage(STORAGE_KEY, state)
  }, [state])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const runRollover = () => {
      const today = new Date().toISOString().slice(0, 10)
      const last = readString(ROLLOVER_KEY, '')
      if (last === today) return

      const quests = readStorage('solo_leveling_quests_v1', [])
      let xpPenalty = 0
      const now = new Date().toISOString()
      const updatedQuests = quests.map((quest) => {
        if (quest.status !== 'active') return quest
        if (!quest.deadline) return quest
        if (quest.deadline >= today) return quest
        xpPenalty += Number(quest.xp) || 0
        return { ...quest, status: 'failed', failedAt: now, updatedAt: now }
      })
      if (updatedQuests.length) {
        writeStorage('solo_leveling_quests_v1', updatedQuests)
      }

      const habits = readStorage('solo_leveling_habits_v1', [])
      const updatedHabits = habits.map((habit) => {
        if (!habit.lastCompleted) return habit
        const lastDate = new Date(habit.lastCompleted)
        const diffDays = Math.floor(
          (new Date(today) - lastDate) / (1000 * 60 * 60 * 24)
        )
        if (diffDays <= 1) return habit
        return { ...habit, streak: 0, updatedAt: now }
      })
      if (updatedHabits.length) {
        writeStorage('solo_leveling_habits_v1', updatedHabits)
      }

      if (xpPenalty > 0) {
        setState((prev) => applyXpDelta(prev, -xpPenalty))
      }
      writeString(ROLLOVER_KEY, today)
    }

    runRollover()
    const timer = setInterval(runRollover, 60 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const addXP = (amount) => {
    const value = clampNumber(amount, 0)
    if (value <= 0) return
    setState((prev) => applyXpDelta(prev, value))
  }

  const removeXP = (amount) => {
    const value = clampNumber(amount, 0)
    if (value <= 0) return
    setState((prev) => applyXpDelta(prev, -value))
  }

  const addGold = (amount) => {
    const value = clampNumber(amount, 0)
    if (value <= 0) return
    setState((prev) => ({ ...prev, gold: prev.gold + value }))
  }

  const spendGold = (amount) => {
    const value = clampNumber(amount, 0)
    if (value <= 0) return
    setState((prev) => {
      if (prev.gold < value) return prev
      return { ...prev, gold: prev.gold - value }
    })
  }

  const setStreak = (value) => {
    const next = Math.max(0, clampNumber(value, 0))
    setState((prev) => ({ ...prev, streak: next }))
  }

  const incrementStreak = () => {
    setState((prev) => ({ ...prev, streak: prev.streak + 1 }))
  }

  const resetStreak = () => {
    setState((prev) => ({ ...prev, streak: 0 }))
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
    addXP,
    removeXP,
    addGold,
    spendGold,
    setStreak,
    incrementStreak,
    resetStreak,
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
