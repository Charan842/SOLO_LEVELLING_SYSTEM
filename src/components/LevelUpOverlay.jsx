import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Sparkles } from 'lucide-react'
import { useGame } from '../context/GameContext'

function LevelUpOverlay() {
  const { level, rank } = useGame()
  const prevLevel = useRef(level)
  const [open, setOpen] = useState(false)
  const [displayLevel, setDisplayLevel] = useState(level)
  const [displayRank, setDisplayRank] = useState(rank)

  useEffect(() => {
    if (level > prevLevel.current) {
      setDisplayLevel(level)
      setDisplayRank(rank)
      setOpen(true)
      const timer = setTimeout(() => setOpen(false), 2600)
      return () => clearTimeout(timer)
    }
    prevLevel.current = level
    return undefined
  }, [level, rank])

  useEffect(() => {
    prevLevel.current = level
  }, [level])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-fuchsia-400/40 bg-gradient-to-br from-slate-950/95 via-black/95 to-slate-900/95 p-8 text-center shadow-[0_0_60px_rgba(168,85,247,0.5)]"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.35),_transparent_60%)]" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.35em] text-slate-400">
                <Sparkles className="h-4 w-4 text-fuchsia-300" />
                Level Up
              </div>
              <div className="text-4xl font-semibold text-white">Level {displayLevel}</div>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                <Crown className="h-4 w-4 text-amber-200" />
                Rank {displayRank}
              </div>
              <div className="text-xs text-slate-400">
                Power surge detected. New gate thresholds unlocked.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default LevelUpOverlay
