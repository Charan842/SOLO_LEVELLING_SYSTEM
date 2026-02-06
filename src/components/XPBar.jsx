import { motion } from 'framer-motion'

function XPBar({ xp = 0, nextLevelXP = 100, xpPercent }) {
  const safeNext = Math.max(1, Number(nextLevelXP) || 1)
  const computedPercent = Math.min(
    100,
    Math.round(((Number(xp) || 0) / safeNext) * 100)
  )
  const percent = typeof xpPercent === 'number' ? xpPercent : computedPercent

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_0_25px_rgba(79,70,229,0.25)]">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-slate-400">
        <span>Experience</span>
        <span className="text-slate-200">
          {Number(xp) || 0} / {safeNext} XP
        </span>
      </div>

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full border border-white/10 bg-black/60">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-400 to-cyan-400 shadow-[0_0_18px_rgba(124,58,237,0.7)]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>Progress</span>
        <span className="text-slate-200">{Math.min(100, Math.max(0, percent))}%</span>
      </div>

      <motion.div
        className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-fuchsia-300/80 to-transparent"
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

export default XPBar
