const intensityStyles = [
  { bg: 'rgba(15,23,42,0.7)', border: 'rgba(148,163,184,0.18)' },
  { bg: 'rgba(59,130,246,0.25)', border: 'rgba(59,130,246,0.35)' },
  { bg: 'rgba(14,165,233,0.35)', border: 'rgba(14,165,233,0.5)' },
  { bg: 'rgba(56,189,248,0.5)', border: 'rgba(56,189,248,0.7)' },
  { bg: 'rgba(168,85,247,0.55)', border: 'rgba(168,85,247,0.8)' },
]

const clampIntensity = (value) => {
  if (Number.isNaN(Number(value))) return 0
  return Math.min(intensityStyles.length - 1, Math.max(0, Number(value)))
}

function HabitHeatmap({ days = [] }) {
  const items = Array.from({ length: 35 }, (_, index) => {
    return days[index] || { date: '', count: 0 }
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
        <span>30 Day Heatmap</span>
        <span className="text-slate-300">Consistency</span>
      </div>

      <div className="grid grid-cols-5 grid-rows-7 grid-flow-col gap-1">
        {items.map((day, index) => {
          const intensity = clampIntensity(day.count)
          const style = intensityStyles[intensity]
          return (
            <div
              key={`${day.date || 'cell'}-${index}`}
              title={day.date ? `${day.date} · ${day.count} wins` : 'No record'}
              className="h-4 w-4 rounded-sm border"
              style={{
                backgroundColor: style.bg,
                borderColor: style.border,
                boxShadow:
                  intensity > 0 ? '0 0 8px rgba(56,189,248,0.35)' : 'none',
              }}
            />
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>Low</span>
        <div className="flex items-center gap-1">
          {intensityStyles.map((style, index) => (
            <span
              key={`legend-${index}`}
              className="h-3 w-3 rounded-sm border"
              style={{ backgroundColor: style.bg, borderColor: style.border }}
            />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  )
}

export default HabitHeatmap
