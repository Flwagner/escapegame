export function getRemainingSeconds(deadlineAt: number, referenceTime: number): number {
  return Math.max(0, Math.ceil((deadlineAt - referenceTime) / 1000))
}

export function formatRemainingTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
