import { useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import PomodoroTimer from '../components/PomodoroTimer'
import QuestCard from '../components/QuestCard'
import { useGame } from '../context/GameContext'
import { setLastAction } from '../utils/actionLog'
import {
  ensureFixedQuests,
  loadFixedQuests,
  QUESTS_STORAGE_KEY,
} from '../utils/fixedData'
import { readString, writeStorage, writeString } from '../utils/storage'

const STORAGE_KEY = QUESTS_STORAGE_KEY
const FOCUS_KEY = 'solo_leveling_focus_v1'

const saveQuests = (quests) => {
  writeStorage(STORAGE_KEY, quests)
}

function Quests() {
  const { addXP, removeXP, addGold } = useGame()
  const [quests, setQuests] = useState(() => loadFixedQuests())
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
    const normalized = ensureFixedQuests(next)
    setQuests(normalized)
    saveQuests(normalized)
  }

  const updateFocus = (id) => {
    setFocusId(id)
    writeString(FOCUS_KEY, id || '')
  }

  const handleComplete = (id) => {
    const timestamp = new Date().toISOString()
    const dateKey = timestamp.slice(0, 10)
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
      addXP(totalXp, {
        trackHistory: true,
        dateKey,
        historyPatch: { questsDoneDelta: 1 },
      })
      addGold(completed.gold, {
        trackHistory: true,
        dateKey,
      })
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
    const dateKey = timestamp.slice(0, 10)
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
      removeXP(failed.xp, {
        source: 'quest',
        trackHistory: true,
        dateKey,
        historyPatch: { questsFailedDelta: 1 },
      })
      setLastAction({ type: 'quest_fail', questId: failed.id, xp: failed.xp })
      if (focusId === failed.id) {
        updateFocus('')
      }
    }
    updateQuests(next)
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
            <h2 className="mt-2 text-2xl font-semibold text-white">Fixed Daily Missions</h2>
            <p className="text-sm text-slate-300">
              Quests are fixed. Complete quests to earn XP and gold.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200">
            <ScrollText className="h-4 w-4 text-fuchsia-300" />
            {activeQuests.length} Active
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Active</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {activeQuests.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                All fixed quests are currently closed.
              </div>
            )}
            {activeQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={handleComplete}
                onFail={handleFail}
                onFocus={handleFocus}
                isFocus={focusId === quest.id}
                allowArchive={false}
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
