export const MIN_SCALE = 1
export const MAX_SCALE = 4

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

export function clampPan(
  value: number,
  { containerSize, contentSize, scale }: { containerSize: number; contentSize: number; scale: number },
): number {
  const scaledContentSize = contentSize * scale
  const maxOffset = Math.max(0, (scaledContentSize - containerSize) / 2)
  if (maxOffset === 0) return 0
  return Math.min(maxOffset, Math.max(-maxOffset, value))
}
