export function shuffleSequenceItems<T extends { id: string }>(
  items: readonly T[],
  correctOrder: readonly string[],
  random = Math.random,
) {
  const shuffled = [...items]

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  if (shuffled.every((item, index) => item.id === correctOrder[index])) {
    ;[shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]]
  }

  return shuffled
}
