/**
 * Logique pure (testée) pour le zoom/pan du Lightbox : bornage du niveau de
 * zoom et du déplacement (pan) pour ne jamais sortir du cadre visible.
 */

export const MIN_SCALE = 1
export const MAX_SCALE = 4

/** Borne un niveau de zoom entre MIN_SCALE et MAX_SCALE. */
export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

/**
 * Borne la translation (pan) en fonction du niveau de zoom courant, pour que
 * l'image reste toujours au moins partiellement visible dans le cadre.
 * `containerSize` / `contentSize` en pixels, `scale` = niveau de zoom courant.
 */
export function clampPan(
  value: number,
  { containerSize, contentSize, scale }: { containerSize: number; contentSize: number; scale: number },
): number {
  const scaledContentSize = contentSize * scale
  const maxOffset = Math.max(0, (scaledContentSize - containerSize) / 2)
  if (maxOffset === 0) return 0
  return Math.min(maxOffset, Math.max(-maxOffset, value))
}

/** Calcule le prochain niveau de zoom pour un double-tap/double-clic (toggle 1x <-> 2.5x). */
export function nextDoubleTapScale(currentScale: number): number {
  return currentScale > MIN_SCALE ? MIN_SCALE : 2.5
}
