import { motion } from 'framer-motion'

const accentStyles = {
  awakening: {
    glow: 'rgba(56,189,248,0.45)',
    gradient:
      'linear-gradient(135deg, rgba(56,189,248,0.7), rgba(34,211,238,0.5), rgba(129,140,248,0.65))',
  },
  habits: {
    glow: 'rgba(16,185,129,0.45)',
    gradient:
      'linear-gradient(135deg, rgba(16,185,129,0.7), rgba(45,212,191,0.5), rgba(34,211,238,0.65))',
  },
  quests: {
    glow: 'rgba(217,70,239,0.45)',
    gradient:
      'linear-gradient(135deg, rgba(217,70,239,0.7), rgba(168,85,247,0.5), rgba(99,102,241,0.6))',
  },
  dashboard: {
    glow: 'rgba(248,113,113,0.45)',
    gradient:
      'linear-gradient(135deg, rgba(248,113,113,0.7), rgba(251,113,133,0.5), rgba(251,146,60,0.6))',
  },
}

function Navigation({ sections, activeSection, onChange }) {
  const primarySections = sections.filter((section) => section.isPrimary)

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {primarySections.map((section, index) => {
        const Icon = section.icon
        const isActive = activeSection === section.id
        const accent = accentStyles[section.id] || accentStyles.dashboard

        return (
          <motion.button
            key={section.id}
            type="button"
            onClick={() => onChange(section.id)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`group relative overflow-hidden rounded-3xl border px-5 py-4 text-left transition ${
              isActive
                ? 'border-white/40 bg-white/10 shadow-[0_0_35px_rgba(168,85,247,0.45)]'
                : 'border-white/10 bg-white/5 shadow-[0_0_25px_rgba(15,23,42,0.5)]'
            }`}
          >
            <div
              className={`absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 ${
                isActive ? 'opacity-100' : ''
              }`}
              style={{ backgroundImage: accent.gradient }}
            />
            <div
              className={`absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl transition ${
                isActive ? 'opacity-90' : 'opacity-40'
              }`}
              style={{ backgroundColor: accent.glow }}
            />
            <div className="relative z-10 flex h-full flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  Zone {String(index + 1).padStart(2, '0')}
                </span>
                <Icon className="h-5 w-5 text-white/80 transition group-hover:scale-110" />
              </div>

              <div className="space-y-2">
                <div
                  className={`text-lg font-semibold tracking-wide ${
                    isActive ? 'text-white' : 'text-slate-100'
                  }`}
                >
                  {section.label}
                </div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {section.subtitle}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Tap to deploy</span>
                <span
                  className={`h-2 w-10 rounded-full ${
                    isActive ? 'bg-white/70' : 'bg-white/20'
                  }`}
                />
              </div>
            </div>
            <div
              className={`absolute inset-x-6 bottom-3 h-px ${
                isActive ? 'opacity-80' : 'opacity-30'
              }`}
              style={{ backgroundImage: accent.gradient }}
            />
          </motion.button>
        )
      })}
    </section>
  )
}

export default Navigation
