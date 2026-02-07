import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Crown, PencilLine, Save, ScrollText, User } from 'lucide-react'

const rankStyles = {
  E: 'from-slate-500/50 via-slate-400/30 to-slate-300/30 border-slate-400/40 text-slate-100',
  D: 'from-cyan-500/55 via-cyan-300/35 to-slate-300/30 border-cyan-400/45 text-cyan-100',
  C: 'from-emerald-500/55 via-emerald-300/35 to-slate-300/30 border-emerald-400/45 text-emerald-100',
  B: 'from-indigo-500/55 via-purple-400/35 to-slate-300/30 border-indigo-400/45 text-indigo-100',
  A: 'from-fuchsia-500/55 via-fuchsia-300/35 to-slate-300/30 border-fuchsia-400/45 text-fuchsia-100',
  S: 'from-amber-400/65 via-amber-300/40 to-slate-300/30 border-amber-300/60 text-amber-100',
}

const toDisplayNumber = (value) => {
  const safe = Number(value)
  if (!Number.isFinite(safe)) return '0'
  return Math.max(0, Math.floor(safe)).toLocaleString('en-US')
}

function MetricCard({ label, value, caption, icon: Icon, accent }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/45 p-4">
      <div
        className="absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl"
        style={{ backgroundColor: accent }}
      />
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          {caption ? <p className="mt-1 text-xs text-slate-400">{caption}</p> : null}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <Icon className="h-4.5 w-4.5 text-white/85" />
        </div>
      </div>
    </div>
  )
}

function ProfileStats({
  playerName,
  title,
  level,
  rank,
  totalXPEarned,
  accountAgeDays,
  onUpdateProfile,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState({
    playerName: playerName || 'Hunter',
    title: title || 'Shadow Trainee',
  })

  useEffect(() => {
    setForm({
      playerName: playerName || 'Hunter',
      title: title || 'Shadow Trainee',
    })
  }, [playerName, title])

  const rankStyle = rankStyles[rank] || rankStyles.E
  const safeAge = useMemo(() => Math.max(1, Number(accountAgeDays) || 1), [accountAgeDays])

  const handleSave = () => {
    const nextName = form.playerName.trim() || 'Hunter'
    const nextTitle = form.title.trim() || 'Shadow Trainee'
    onUpdateProfile({ playerName: nextName, title: nextTitle })
    setIsEditing(false)
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_30px_rgba(99,102,241,0.25)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Player Identity</p>
          {!isEditing ? (
            <>
              <h2 className="text-2xl font-semibold text-white">{form.playerName}</h2>
              <p className="text-sm text-slate-300">{form.title}</p>
            </>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={form.playerName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, playerName: event.target.value }))
                }
                placeholder="Player name"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
              />
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Title"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full border bg-gradient-to-r px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${rankStyle}`}
          >
            <Crown className="h-4 w-4" />
            Rank {rank}
          </span>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/30"
            >
              <PencilLine className="h-4 w-4" />
              Edit
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100 transition hover:bg-emerald-400/20"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Player Level"
          value={toDisplayNumber(level)}
          caption="Current progression stage"
          icon={User}
          accent="rgba(34,211,238,0.5)"
        />
        <MetricCard
          label="Current Rank"
          value={rank}
          caption="E to S classification"
          icon={Crown}
          accent="rgba(168,85,247,0.5)"
        />
        <MetricCard
          label="Lifetime XP"
          value={toDisplayNumber(totalXPEarned)}
          caption="Total XP earned across all days"
          icon={ScrollText}
          accent="rgba(217,70,239,0.45)"
        />
        <MetricCard
          label="Account Age"
          value={`${toDisplayNumber(safeAge)}d`}
          caption="Days since first system use"
          icon={CalendarClock}
          accent="rgba(56,189,248,0.45)"
        />
      </div>
    </section>
  )
}

export default ProfileStats

