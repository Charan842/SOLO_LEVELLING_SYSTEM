import { Award, Lock, Unlock } from 'lucide-react'

const colorStyles = {
  emerald: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100',
  fuchsia: 'border-fuchsia-400/35 bg-fuchsia-400/10 text-fuchsia-100',
  cyan: 'border-cyan-400/35 bg-cyan-400/10 text-cyan-100',
  amber: 'border-amber-400/35 bg-amber-400/10 text-amber-100',
  indigo: 'border-indigo-400/35 bg-indigo-400/10 text-indigo-100',
  rose: 'border-rose-400/35 bg-rose-400/10 text-rose-100',
}

function AchievementCard({ achievement }) {
  const tone = colorStyles[achievement.color] || colorStyles.indigo
  const unlocked = Boolean(achievement.unlocked)
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        unlocked ? tone : 'border-white/10 bg-white/5 text-slate-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          <p className="text-sm font-semibold">{achievement.title}</p>
        </div>
        {unlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
      </div>
      <p className="mt-2 text-xs opacity-90">{achievement.description}</p>
      <p className="mt-2 text-[10px] uppercase tracking-[0.2em] opacity-80">
        {unlocked
          ? `Unlocked ${achievement.unlockedAt?.slice(0, 10) || ''}`
          : 'Locked'}
      </p>
    </div>
  )
}

export default AchievementCard
