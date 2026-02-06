import { readStorage, writeStorage } from './storage'

const ACTION_KEY = 'solo_leveling_last_action_v1'

export const setLastAction = (action) => {
  if (!action) return
  writeStorage(ACTION_KEY, { ...action, timestamp: new Date().toISOString() })
}

export const getLastAction = () => readStorage(ACTION_KEY, null)

export const clearLastAction = () => writeStorage(ACTION_KEY, null)

