export const xpForNextLevel = (level) => level * level * 100

export const applyXpChange = ({ xp, level }, delta) => {
  let nextXp = Number(xp) + Number(delta)
  let nextLevel = Math.max(1, Number(level) || 1)

  while (nextXp >= xpForNextLevel(nextLevel)) {
    nextXp -= xpForNextLevel(nextLevel)
    nextLevel += 1
  }

  while (nextXp < 0 && nextLevel > 1) {
    nextLevel -= 1
    nextXp += xpForNextLevel(nextLevel)
  }

  nextXp = Math.max(0, nextXp)
  return { xp: nextXp, level: nextLevel }
}

