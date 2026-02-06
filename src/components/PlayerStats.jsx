import { Crown, Flame, Gem, Sparkles, Swords } from 'lucide-react'
import { useGame } from '../context/GameContext'
import XPBar from './XPBar'

const rankStyles = {
  E: 'from-slate-500/60 via-slate-400/40 to-slate-300/40 border-slate-400/40 text-slate-200',
  D: 'from-cyan-500/60 via-cyan-300/40 to-slate-300/40 border-cyan-400/40 text-cyan-100',
  C: 'from-emerald-500/60 via-emerald-300/40 to-slate-300/40 border-emerald-400/40 text-emerald-100',
  B: 'from-indigo-500/60 via-purple-400/40 to-slate-300/40 border-indigo-400/40 text-indigo-100',
  A: 'from-fuchsia-500/60 via-fuchsia-300/40 to-slate-300/40 border-fuchsia-400/40 text-fuchsia-100',
  S: 'from-amber-400/70 via-amber-300/40 to-slate-300/40 border-amber-300/60 text-amber-100',
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/50 p-4 shadow-[0_0_20px_rgba(15,23,42,0.45)]">
      <div
        className="absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <Icon className="h-5 w-5 text-white/80" />
        </div>
      </div>
    </div>
  )
}

function PlayerStats() {
  const { xp, level, rank, gold, streak, nextLevelXP, xpPercent } = useGame()
  const rankStyle = rankStyles[rank] || rankStyles.E

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-black/80 p-6 shadow-[0_0_35px_rgba(124,58,237,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Player Core</p>
            <h2 className="text-2xl font-semibold text-white">Shadow Hunter</h2>
            <p className="text-sm text-slate-300">Stay consistent. Dominate your gates.</p>
          </div>
          <div
            className={`flex items-center gap-3 rounded-full border bg-gradient-to-r px-4 py-2 text-sm shadow-[0_0_18px_rgba(168,85,247,0.35)] ${rankStyle}`}
          >
            <Sparkles className="h-4 w-4" />
            Rank {rank}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Level" value={level} icon={Crown} accent="rgba(124,58,237,0.6)" />
          <StatCard label="XP" value={`${xp}/${nextLevelXP}`} icon={Swords} accent="rgba(56,189,248,0.6)" />
          <StatCard label="Gold" value={gold} icon={Gem} accent="rgba(251,191,36,0.6)" />
          <StatCard label="Streak" value={`${streak} days`} icon={Flame} accent="rgba(248,113,113,0.6)" />
        </div>
      </div>

      <XPBar xp={xp} nextLevelXP={nextLevelXP} xpPercent={xpPercent} />
    </section>
  )
}

export default PlayerStats
