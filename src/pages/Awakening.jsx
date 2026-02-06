import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Skull, Sparkles } from 'lucide-react'
import { readStorage, writeStorage } from '../utils/storage'

const STORAGE_KEY = 'solo_leveling_awakening_v1'

const loadState = () =>
  readStorage(STORAGE_KEY, {
    vision: '',
    antiVision: '',
  })

function Awakening() {
  const [vision, setVision] = useState('')
  const [antiVision, setAntiVision] = useState('')

  useEffect(() => {
    const stored = loadState()
    setVision(stored.vision || '')
    setAntiVision(stored.antiVision || '')
  }, [])

  useEffect(() => {
    writeStorage(STORAGE_KEY, { vision, antiVision })
  }, [vision, antiVision])

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_35px_rgba(59,130,246,0.3)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_60%)]" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Awakening</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Vision & Anti-Vision</h2>
            <p className="text-sm text-slate-300">
              Define who you are becoming and what happens if you stand still.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-200">
            <Sparkles className="h-4 w-4 text-fuchsia-300" />
            System Awakening
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-slate-900/80 to-black/80 p-6 shadow-[0_0_30px_rgba(34,211,238,0.35)]"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/40 bg-cyan-400/10 p-3">
              <Eye className="h-5 w-5 text-cyan-200" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Vision</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Your future self
              </p>
            </div>
          </div>
          <textarea
            value={vision}
            onChange={(event) => setVision(event.target.value)}
            placeholder="Describe who you are becoming. Be precise. Be relentless."
            className="mt-4 h-48 w-full resize-none rounded-2xl border border-white/10 bg-black/60 p-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:outline-none"
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-rose-500/10 via-slate-900/80 to-black/80 p-6 shadow-[0_0_30px_rgba(244,63,94,0.35)]"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 p-3">
              <Skull className="h-5 w-5 text-rose-200" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Anti-Vision</h3>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Cost of inaction
              </p>
            </div>
          </div>
          <textarea
            value={antiVision}
            onChange={(event) => setAntiVision(event.target.value)}
            placeholder="Describe the future you refuse to live. Make it vivid."
            className="mt-4 h-48 w-full resize-none rounded-2xl border border-white/10 bg-black/60 p-4 text-sm text-white placeholder:text-slate-500 focus:border-rose-400/60 focus:outline-none"
          />
        </motion.section>
      </div>
    </div>
  )
}

export default Awakening
