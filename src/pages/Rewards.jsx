import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Gem, Gift, ShieldCheck } from 'lucide-react'
import RewardCard from '../components/RewardCard'
import { useGame } from '../context/GameContext'
import { setLastAction } from '../utils/actionLog'
import { readStorage, writeStorage } from '../utils/storage'

const STORAGE_KEY = 'solo_leveling_rewards_v1'
const LOG_KEY = 'solo_leveling_reward_log_v1'

const defaultRewards = [
  {
    id: 'reward-1',
    title: '1 Hour Free Time',
    description: 'Unplug and reset your mind.',
    cost: 150,
    cooldownDays: 1,
  },
  {
    id: 'reward-2',
    title: 'Game Session (30 mins)',
    description: 'Short, guilt-free gaming break.',
    cost: 75,
    cooldownDays: 1,
  },
  {
    id: 'reward-3',
    title: 'Special Meal',
    description: 'Order something legendary.',
    cost: 200,
    cooldownDays: 3,
  },
  {
    id: 'reward-4',
    title: 'Movie Night',
    description: 'One full movie, no multitasking.',
    cost: 180,
    cooldownDays: 2,
  },
]

const normalizeRewards = (items) =>
  (items || []).map((reward) => ({
    redeemCount: 0,
    lastRedeemedAt: '',
    cooldownDays: 1,
    ...reward,
  }))

const loadRewards = () => normalizeRewards(readStorage(STORAGE_KEY, defaultRewards))
const loadRewardLog = () => readStorage(LOG_KEY, [])

const getCooldownInfo = (reward) => {
  if (!reward.lastRedeemedAt) return { onCooldown: false, label: '' }
  const cooldownMs = (reward.cooldownDays || 1) * 24 * 60 * 60 * 1000
  const nextAvailable = new Date(reward.lastRedeemedAt).getTime() + cooldownMs
  const remaining = nextAvailable - Date.now()
  if (remaining <= 0) return { onCooldown: false, label: '' }
  const hours = Math.ceil(remaining / (1000 * 60 * 60))
  return { onCooldown: true, label: `${hours}h` }
}

function Rewards() {
  const { gold, spendGold } = useGame()
  const [rewards, setRewards] = useState(() => loadRewards())
  const [rewardLog, setRewardLog] = useState(() => loadRewardLog())

  const updateRewards = (next) => {
    setRewards(next)
    writeStorage(STORAGE_KEY, next)
  }

  const updateLog = (next) => {
    setRewardLog(next)
    writeStorage(LOG_KEY, next)
  }

  const handleRedeem = (id) => {
    const target = rewards.find((reward) => reward.id === id)
    if (!target) return
    const { onCooldown } = getCooldownInfo(target)
    if (onCooldown) return
    if (gold < target.cost) return
    const now = new Date().toISOString()
    const dateKey = now.slice(0, 10)
    spendGold(target.cost, {
      trackHistory: true,
      dateKey,
    })
    const previousReward = { ...target }
    const next = rewards.map((reward) =>
      reward.id === id
        ? {
            ...reward,
            redeemCount: (reward.redeemCount || 0) + 1,
            lastRedeemedAt: now,
          }
        : reward
    )
    updateRewards(next)
    updateLog([
      { id: `reward-log-${Date.now()}`, title: target.title, cost: target.cost, at: now },
      ...rewardLog,
    ])
    setLastAction({
      type: 'reward_redeem',
      rewardId: target.id,
      cost: target.cost,
      previousReward,
    })
  }

  const claimedRewards = useMemo(() => rewards.filter((reward) => reward.redeemCount), [rewards])

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-950/80 p-6 shadow-[0_0_30px_rgba(251,191,36,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Reward Vault</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Redeem Gold</h2>
            <p className="text-sm text-slate-300">
              Spend hard-earned gold on rewards that recharge you.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            <Gem className="h-4 w-4" />
            {gold} Gold
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Redemption Rules
          </div>
          <ul className="mt-3 text-sm text-slate-400">
            <li>Gold never goes negative.</li>
            <li>Claimed rewards are permanent.</li>
            <li>Focus on rewards that restore energy.</li>
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr]">
        <div className="grid gap-4 md:grid-cols-2">
          {rewards.map((reward) => {
            const cooldown = getCooldownInfo(reward)
            return (
              <RewardCard
                key={reward.id}
                reward={reward}
                canRedeem={gold >= reward.cost}
                onRedeem={handleRedeem}
                onCooldown={cooldown.onCooldown}
                cooldownLabel={cooldown.label}
              />
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Claimed Rewards</h3>
            <Gift className="h-4 w-4 text-amber-200" />
          </div>
          {claimedRewards.length === 0 && (
            <p className="text-sm text-slate-400">No rewards claimed yet.</p>
          )}
          <div className="space-y-2 text-sm text-slate-300">
            {claimedRewards.map((reward) => (
              <div
                key={reward.id}
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100"
              >
                {reward.title} - {reward.redeemCount || 0}x
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-lg font-semibold text-white">Redemption Log</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-400">
          {rewardLog.length === 0 && <p>No redemptions yet.</p>}
          {rewardLog.slice(0, 8).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-300"
            >
              <span>{entry.title}</span>
              <span>{entry.cost} G - {entry.at?.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Rewards
