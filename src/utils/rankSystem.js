export const rankFromLevel = (level) => {
  if (level < 5) return 'E'
  if (level < 10) return 'D'
  if (level < 20) return 'C'
  if (level < 35) return 'B'
  if (level < 50) return 'A'
  return 'S'
}

