export interface Size {
  width: number
  height: number
}

/** Calcule le plus grand rectangle non rogne qui tient dans le viewport. */
export function getContainedSize(container: Size, content: Size): Size {
  if (container.width <= 0 || container.height <= 0 || content.width <= 0 || content.height <= 0) {
    return { width: 0, height: 0 }
  }

  const scale = Math.min(container.width / content.width, container.height / content.height)
  return {
    width: content.width * scale,
    height: content.height * scale,
  }
}

export function pointToPercent(point: { x: number; y: number }, bounds: Size) {
  if (bounds.width <= 0 || bounds.height <= 0) return { x: 0, y: 0 }

  return {
    x: Math.min(100, Math.max(0, (point.x / bounds.width) * 100)),
    y: Math.min(100, Math.max(0, (point.y / bounds.height) * 100)),
  }
}
