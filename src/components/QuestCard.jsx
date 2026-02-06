import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Crosshair, Flame, Skull, Swords } from 'lucide-react'

const difficultyStyles = {
  Easy: {
    badge: 'border-emerald-400/40 text-emerald-200 bg-emerald-400/10',
    glow: 'rgba(16,185,129,0.35)',
  },
  Normal: {
    badge: 'border-cyan-400/40 text-cyan-200 bg-cyan-400/10',
    glow: 'rgba(34,211,238,0.35)',
  },
  Hard: {
    badge: 'border-rose-400/40 text-rose-200 bg-rose-400/10',
    glow: 'rgba(248,113,113,0.35)',
  },
}

function QuestCard({ quest, onComplete, onFail, onDelete, onFocus, isFocus }) {
  const difficulty = difficultyStyles[quest.difficulty] || difficultyStyles.Normal
  const statusColor =
    quest.status === 'completed'
      ? 'text-emerald-300'
      : quest.status === 'failed'
        ? 'text-rose-300'
        : 'text-slate-300'

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className={`relative overflow-hidden rounded-2xl border bg-black/40 p-4 shadow-[0_0_24px_rgba(15,23,42,0.5)] ${
        isFocus ? 'border-fuchsia-400/60 shadow-[0_0_30px_rgba(217,70,239,0.5)]' : 'border-white/10'
      }`}
    >
      <div
        className="absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl"
        style={{ backgroundColor: difficulty.glow }}
      />
      <div className="relative z-10 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-white">{quest.title}</h4>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {quest.deadline ? `Deadline ${quest.deadline}` : 'No deadline'}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${difficulty.badge}`}
          >
            {quest.difficulty}
          </span>
        </div>

        {isFocus && (
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-fuchsia-200">
            <Crosshair className="h-3 w-3" />
            Focus Target +10% XP
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
            <span className="flex items-center gap-1">
              <Swords className="h-3 w-3 text-fuchsia-300" />
              {quest.xp} XP
            </span>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
            <span className="flex items-center gap-1">
              <Flame className="h-3 w-3 text-amber-300" />
              {quest.gold} G
            </span>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-300" />
              {quest.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`text-xs uppercase tracking-[0.3em] ${statusColor}`}>
            {quest.status}
          </span>
          <div className="flex flex-wrap gap-2">
            {quest.status === 'active' && (
              <>
                <button
                  type="button"
                  onClick={() => onFocus(quest.id)}
                  className="flex items-center gap-1 rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-xs font-semibold text-fuchsia-200 transition hover:bg-fuchsia-400/20"
                >
                  <Crosshair className="h-3 w-3" />
                  {isFocus ? 'Focused' : 'Focus'}
                </button>
                <button
                  type="button"
                  onClick={() => onComplete(quest.id)}
                  className="flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Complete
                </button>
                <button
                  type="button"
                  onClick={() => onFail(quest.id)}
                  className="flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
                >
                  <Skull className="h-3 w-3" />
                  Fail
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => onDelete(quest.id)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default QuestCard
