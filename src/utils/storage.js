export const safeParse = (value, fallback) => {
  if (typeof value !== 'string') return fallback
  try {
    return JSON.parse(value)
  } catch (error) {
    return fallback
  }
}

export const readStorage = (key, fallback) => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return safeParse(raw, fallback)
  } catch (error) {
    return fallback
  }
}

export const writeStorage = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    // Ignore write errors (private mode, storage full, etc.)
  }
}

export const readString = (key, fallback = '') => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ?? fallback
  } catch (error) {
    return fallback
  }
}

export const writeString = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch (error) {
    // Ignore write errors.
  }
}

