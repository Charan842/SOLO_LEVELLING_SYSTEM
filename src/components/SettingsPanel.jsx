import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Gauge,
  MoonStar,
  RefreshCcw,
  Settings2,
  SlidersHorizontal,
  UserPen,
} from 'lucide-react'

function ToggleRow({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-2">
      <div>
        <p className="text-sm text-slate-100">{label}</p>
        {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? 'bg-emerald-400/60' : 'bg-slate-700/70'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? 'left-[1.35rem]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

function SettingsPanel({
  settings,
  onUpdateSettings,
  onUpdateProfile,
  playerName,
  title,
  onResetStreak,
  onHardReset,
}) {
  const [profileForm, setProfileForm] = useState({
    playerName: playerName || 'Hunter',
    title: title || 'Shadow Trainee',
  })

  useEffect(() => {
    setProfileForm({
      playerName: playerName || 'Hunter',
      title: title || 'Shadow Trainee',
    })
  }, [playerName, title])

  const updateSetting = (key, value) => {
    onUpdateSettings({ [key]: value })
  }

  const handleSaveIdentity = () => {
    onUpdateProfile({
      playerName: profileForm.playerName.trim() || 'Hunter',
      title: profileForm.title.trim() || 'Shadow Trainee',
    })
  }

  const handleResetStreak = () => {
    const proceed = window.confirm('Reset current streak to 0?')
    if (!proceed) return
    onResetStreak()
  }

  const handleHardReset = () => {
    const proceed = window.confirm(
      'Hard reset all data? This clears state, quests, habits, rewards, and logs.'
    )
    if (!proceed) return
    onHardReset()
    window.location.reload()
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-black/80 to-slate-950/85 p-6 shadow-[0_0_28px_rgba(168,85,247,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Settings</p>
          <h3 className="mt-2 text-xl font-semibold text-white">System Configuration</h3>
        </div>
        <Settings2 className="h-5 w-5 text-slate-300" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <UserPen className="h-4 w-4 text-cyan-300" />
            General Settings
          </div>

          <input
            type="text"
            value={profileForm.playerName}
            onChange={(event) =>
              setProfileForm((prev) => ({ ...prev, playerName: event.target.value }))
            }
            placeholder="Player name"
            className="w-full rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />
          <input
            type="text"
            value={profileForm.title}
            onChange={(event) => setProfileForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Title"
            className="w-full rounded-xl border border-white/10 bg-black/55 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-fuchsia-400/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSaveIdentity}
            className="w-full rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100 transition hover:bg-cyan-400/20"
          >
            Save Identity
          </button>

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleResetStreak}
              className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-400/20"
            >
              Reset Streak
            </button>
            <button
              type="button"
              onClick={handleHardReset}
              className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-100 transition hover:bg-rose-400/20"
            >
              Hard Reset
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <Gauge className="h-4 w-4 text-fuchsia-300" />
            Game Balance
          </div>

          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-100">XP Multiplier</p>
              <span className="text-xs font-semibold text-fuchsia-200">
                {Number(settings.xpMultiplier || 1).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.xpMultiplier || 1}
              onChange={(event) => updateSetting('xpMultiplier', Number(event.target.value))}
              className="mt-2 w-full accent-fuchsia-400"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
            <p className="text-sm text-slate-100">Penalty Severity</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {['Low', 'Medium', 'High'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => updateSetting('penaltySeverity', label)}
                  className={`rounded-lg border px-2 py-1 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                    settings.penaltySeverity === label
                      ? 'border-fuchsia-400/40 bg-fuchsia-400/20 text-fuchsia-100'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Daily XP Cap"
            hint="Limit XP gains per day."
            checked={Boolean(settings.dailyXpCapEnabled)}
            onChange={(value) => updateSetting('dailyXpCapEnabled', value)}
          />

          {settings.dailyXpCapEnabled ? (
            <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-100">Daily XP Cap Value</p>
                <span className="text-xs font-semibold text-cyan-200">
                  {Math.max(0, Number(settings.dailyXpCap || 0))}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={Math.max(50, Number(settings.dailyXpCap || 500))}
                onChange={(event) => updateSetting('dailyXpCap', Number(event.target.value))}
                className="mt-2 w-full accent-cyan-400"
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <SlidersHorizontal className="h-4 w-4 text-emerald-300" />
            Habit Settings
          </div>
          <ToggleRow
            label="Habit Penalties"
            hint="Allow XP loss from missed/failed habit rules."
            checked={Boolean(settings.habitPenalties)}
            onChange={(value) => updateSetting('habitPenalties', value)}
          />
          <ToggleRow
            label="Reset Streak on Miss"
            hint="Break streak if day is missed."
            checked={Boolean(settings.streakResetOnMiss)}
            onChange={(value) => updateSetting('streakResetOnMiss', value)}
          />
          <ToggleRow
            label="Habit Reminder"
            hint="UI-only reminder preference."
            checked={Boolean(settings.habitReminder)}
            onChange={(value) => updateSetting('habitReminder', value)}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            Quest Settings
          </div>
          <ToggleRow
            label="Quest Penalties"
            hint="Allow XP loss from failed quests."
            checked={Boolean(settings.questPenalties)}
            onChange={(value) => updateSetting('questPenalties', value)}
          />
          <ToggleRow
            label="Auto-fail Overdue Quests"
            hint="Rollover marks past-deadline quests as failed."
            checked={Boolean(settings.autoFailOverdueQuests)}
            onChange={(value) => updateSetting('autoFailOverdueQuests', value)}
          />
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm text-slate-200">
            <MoonStar className="h-4 w-4 text-indigo-300" />
            UI Settings
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
              <p className="text-sm text-slate-100">Theme Mode</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateSetting('themeMode', 'dark')}
                  className={`rounded-lg border px-2 py-1 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                    settings.themeMode !== 'light'
                      ? 'border-indigo-400/40 bg-indigo-400/20 text-indigo-100'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  Dark
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('themeMode', 'light')}
                  className={`rounded-lg border px-2 py-1 text-xs font-semibold uppercase tracking-[0.15em] transition ${
                    settings.themeMode === 'light'
                      ? 'border-indigo-400/40 bg-indigo-400/20 text-indigo-100'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  Light
                </button>
              </div>
            </div>
            <ToggleRow
              label="Streak Warnings"
              hint="Warn after 7 PM when tasks remain."
              checked={Boolean(settings.streakWarnings)}
              onChange={(value) => updateSetting('streakWarnings', value)}
            />
            <ToggleRow
              label="Daily Goal Reminders"
              hint="Show reminder copy when tasks are pending."
              checked={Boolean(settings.dailyGoalReminders)}
              onChange={(value) => updateSetting('dailyGoalReminders', value)}
            />
            <ToggleRow
              label="Reduce Animations"
              hint="Lower motion intensity."
              checked={Boolean(settings.reduceAnimations)}
              onChange={(value) => updateSetting('reduceAnimations', value)}
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-100">Glow Intensity</p>
              <span className="text-xs font-semibold text-indigo-200">
                {Math.max(0, Math.min(100, Number(settings.glowIntensity || 0)))}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={Math.max(0, Math.min(100, Number(settings.glowIntensity || 70)))}
              onChange={(event) => updateSetting('glowIntensity', Number(event.target.value))}
              className="mt-2 w-full accent-indigo-400"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <RefreshCcw className="h-3.5 w-3.5" />
        All settings are saved in localStorage immediately.
      </div>
    </section>
  )
}

export default SettingsPanel
