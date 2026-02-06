import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gem, Shield, Sparkles, Swords, Timer } from 'lucide-react'
import './App.css'
import LevelUpOverlay from './components/LevelUpOverlay'
import Navigation from './components/Navigation'
import OpeningTheme from './components/OpeningTheme'
import { GameProvider } from './context/GameContext'

const Awakening = lazy(() => import('./pages/Awakening'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Habits = lazy(() => import('./pages/Habits'))
const Quests = lazy(() => import('./pages/Quests'))
const Rewards = lazy(() => import('./pages/Rewards'))

const SECTION_STORAGE_KEY = 'solo_leveling_active_section'
const ACCESS_CODE = '84267'

const sections = [
  {
    id: 'awakening',
    label: 'Awakening',
    subtitle: 'Vision & Anti-Vision',
    icon: Sparkles,
    accent: 'from-sky-400 via-cyan-300 to-indigo-400',
    isPrimary: true,
  },
  {
    id: 'habits',
    label: 'Habits',
    subtitle: 'Daily Rituals',
    icon: Shield,
    accent: 'from-emerald-400 via-teal-300 to-cyan-400',
    isPrimary: true,
  },
  {
    id: 'quests',
    label: 'Quests',
    subtitle: 'Active Missions',
    icon: Swords,
    accent: 'from-fuchsia-400 via-purple-400 to-indigo-400',
    isPrimary: true,
  },
  {
    id: 'dashboard',
    label: 'Gates',
    subtitle: 'Player Overview',
    icon: Timer,
    accent: 'from-rose-400 via-red-400 to-orange-400',
    isPrimary: true,
  },
  {
    id: 'rewards',
    label: 'Rewards',
    subtitle: 'Spend Gold',
    icon: Gem,
    accent: 'from-amber-300 via-yellow-300 to-orange-300',
    isPrimary: false,
  },
]

const sectionComponents = {
  awakening: Awakening,
  habits: Habits,
  quests: Quests,
  dashboard: Dashboard,
  rewards: Rewards,
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

const pageTransition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
}

const generateParticles = (count) =>
  Array.from({ length: count }, (_, index) => {
    const seed = Math.sin(index * 91.17 + 0.1) * 10000
    const seed2 = Math.sin(index * 47.11 + 1.3) * 10000
    const seed3 = Math.sin(index * 13.57 + 2.1) * 10000
    const normalize = (value) => Math.abs(value % 1)
    return {
      id: index,
      top: `${Math.floor(normalize(seed) * 100)}%`,
      left: `${Math.floor(normalize(seed2) * 100)}%`,
      size: Math.floor(normalize(seed3) * 6) + 2,
      delay: normalize(seed2) * 2,
      duration: normalize(seed) * 4 + 6,
      opacity: normalize(seed3) * 0.5 + 0.15,
    }
  })

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [accessError, setAccessError] = useState('')
  const [activeSection, setActiveSection] = useState(() => {
    if (typeof window === 'undefined') return 'dashboard'
    return window.localStorage.getItem(SECTION_STORAGE_KEY) || 'dashboard'
  })
  const [showIntro, setShowIntro] = useState(true)
  const particles = useMemo(() => generateParticles(18), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SECTION_STORAGE_KEY, activeSection)
  }, [activeSection])

  useEffect(() => {
    if (typeof window === 'undefined') return
    document.body.style.overflow = showIntro || !isUnlocked ? 'hidden' : ''
  }, [showIntro, isUnlocked])

  const handleEnterSystem = () => {
    setShowIntro(false)
  }

  const handleUnlock = (event) => {
    event.preventDefault()
    if (accessCode.trim() === ACCESS_CODE) {
      setIsUnlocked(true)
      setAccessError('')
      setAccessCode('')
      return
    }
    setAccessError('Access code incorrect. Try again.')
  }

  const ActivePage = useMemo(
    () => sectionComponents[activeSection] || Dashboard,
    [activeSection]
  )

  const currentSection = useMemo(
    () => sections.find((section) => section.id === activeSection) || sections[3],
    [activeSection]
  )

  return (
    <GameProvider>
      <div className="relative min-h-screen overflow-hidden bg-[#0a0b14] text-slate-100">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute top-32 right-0 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-red-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(120,90,255,0.15),_transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(255,255,255,0.04),_transparent_35%)]" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, rgba(34,211,238,0.18), transparent 40%), radial-gradient(circle at 80% 30%, rgba(168,85,247,0.18), transparent 45%), radial-gradient(circle at 30% 80%, rgba(248,113,113,0.14), transparent 40%)',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_45%,_rgba(5,6,10,0.85)_100%)]" />
          <div className="noise-layer absolute inset-0 opacity-25 mix-blend-soft-light" />
          <motion.div
            className="absolute inset-x-0 top-12 h-px bg-gradient-to-r from-transparent via-fuchsia-400/70 to-transparent"
            animate={{ opacity: [0.2, 0.7, 0.2], scaleX: [0.9, 1, 0.9] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-16 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
            animate={{ opacity: [0.2, 0.6, 0.2], scaleX: [0.95, 1, 0.95] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="absolute inset-0">
            {particles.map((particle) => (
              <motion.span
                key={particle.id}
                className="absolute rounded-full bg-white/70 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                style={{
                  top: particle.top,
                  left: particle.left,
                  width: particle.size,
                  height: particle.size,
                  opacity: particle.opacity,
                }}
                animate={{ y: [0, -12, 0], opacity: [particle.opacity, 0.6, particle.opacity] }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6">
          <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-[0_0_30px_rgba(124,58,237,0.25)] backdrop-blur">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Solo Leveling System
              </p>
              <h1 className="text-2xl font-semibold text-white">
                {currentSection.label} Console
              </h1>
              <p className="text-sm text-slate-300">{currentSection.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveSection('rewards')}
                className="group inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.35)] transition hover:border-amber-200 hover:bg-amber-300/20"
              >
                <Gem className="h-4 w-4 text-amber-200 transition group-hover:scale-110" />
                Reward Vault
              </button>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-300 md:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                System Stable
              </div>
            </div>
          </header>

          <Navigation
            sections={sections}
            activeSection={activeSection}
            onChange={setActiveSection}
          />

          <AnimatePresence mode="wait">
            <motion.main
              key={activeSection}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex-1"
            >
              <Suspense
                fallback={
                  <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm uppercase tracking-[0.35em] text-slate-300 shadow-[0_0_20px_rgba(124,58,237,0.35)]">
                      Loading system
                    </div>
                  </div>
                }
              >
                <ActivePage />
              </Suspense>
            </motion.main>
          </AnimatePresence>
        </div>
      </div>
      <LevelUpOverlay />
      <OpeningTheme open={showIntro && isUnlocked} onEnter={handleEnterSystem} />
      {!isUnlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05060c]/90 px-4">
          <div className="w-full max-w-md rounded-3xl border border-fuchsia-400/30 bg-black/70 p-6 shadow-[0_0_40px_rgba(168,85,247,0.45)] backdrop-blur">
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.45em] text-fuchsia-300/80">
                Access Gate
              </p>
              <h2 className="text-2xl font-semibold text-white">Enter System Code</h2>
              <p className="text-sm text-slate-300">
                Authorized entry only. Input your private access code.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="mt-6 space-y-4">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                value={accessCode}
                onChange={(event) => {
                  setAccessCode(event.target.value)
                  if (accessError) setAccessError('')
                }}
                placeholder="Access code"
                className="w-full rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-center text-lg tracking-[0.35em] text-white placeholder:text-slate-500 focus:border-fuchsia-400/70 focus:outline-none"
              />
              {accessError && (
                <p className="text-center text-xs text-rose-300">{accessError}</p>
              )}
              <button
                type="submit"
                className="w-full rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-100 transition hover:bg-fuchsia-500/30"
              >
                Enter System
              </button>
            </form>
          </div>
        </div>
      )}
    </GameProvider>
  )
}

export default App
