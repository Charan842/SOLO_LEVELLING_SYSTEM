import { motion } from 'framer-motion'
import { Gem, Lock, Timer, Unlock } from 'lucide-react'

function RewardCard({ reward, canRedeem, onRedeem, onCooldown, cooldownLabel }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_0_24px_rgba(15,23,42,0.5)]"
    >
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-400/20 blur-2xl" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-lg font-semibold text-white">{reward.title}</h4>
            <p className="text-sm text-slate-400">{reward.description}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
            <Gem className="h-3 w-3" />
            {reward.cost} G
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {onCooldown ? 'Cooldown' : 'Available'}
          </span>
          <button
            type="button"
            onClick={() => onRedeem(reward.id)}
            disabled={!canRedeem || onCooldown}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              onCooldown
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                : canRedeem
                  ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20'
                  : 'border-white/10 bg-white/5 text-slate-500'
            }`}
          >
            {onCooldown ? (
              <>
                <Unlock className="h-3 w-3" />
                {cooldownLabel || 'On Cooldown'}
              </>
            ) : (
              <>
                <Lock className="h-3 w-3" />
                Redeem
              </>
            )}
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Redeemed: {reward.redeemCount || 0}</span>
          {onCooldown && (
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {cooldownLabel}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default RewardCard
