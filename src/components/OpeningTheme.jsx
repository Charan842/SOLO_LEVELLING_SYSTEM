import { AnimatePresence, motion } from 'framer-motion'
import { Gem, Sparkles, Swords } from 'lucide-react'

function OpeningTheme({ open, onEnter }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/95 via-black/95 to-slate-900/95 p-8 text-slate-100 shadow-[0_0_60px_rgba(124,58,237,0.45)]"
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.25),_transparent_55%)]" />
            <div className="absolute -top-24 -right-10 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-slate-400">
                <Sparkles className="h-4 w-4 text-fuchsia-300" />
                System Initializing
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold text-white">Solo Leveling Protocol</h2>
                <p className="text-sm text-slate-300">
                  You are the hunter. Each task is a gate. Each habit forges your rank.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                  <Swords className="mb-2 h-4 w-4 text-fuchsia-300" />
                  Quests grant XP + Gold. Failures deduct XP.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                  <Sparkles className="mb-2 h-4 w-4 text-cyan-300" />
                  Habits build streaks that power your rank.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                  <Gem className="mb-2 h-4 w-4 text-amber-200" />
                  Spend Gold to unlock real-world rewards.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onEnter}
                  className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-5 py-2 text-sm font-semibold text-fuchsia-100 shadow-[0_0_20px_rgba(124,58,237,0.6)] transition hover:bg-fuchsia-500/30"
                >
                  Enter System
                </button>
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">
                  Press Start
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default OpeningTheme
