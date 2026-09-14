import { useState } from 'react'
import type { PointerEvent } from 'react'
import type { Hotspot } from '../../types/scenario'
import { pointToPercent } from './sceneGeometry'
import styles from './HotspotDebugOverlay.module.css'

interface Point {
  x: number
  y: number
}

interface Rect extends Point {
  width: number
  height: number
}

interface HotspotDebugOverlayProps {
  hotspots: Hotspot[]
}

function round(value: number) {
  return Math.round(value * 10) / 10
}

export function HotspotDebugOverlay({ hotspots }: HotspotDebugOverlayProps) {
  const [start, setStart] = useState<Point | null>(null)
  const [end, setEnd] = useState<Point | null>(null)
  const [selection, setSelection] = useState<Rect | null>(null)

  function getPoint(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return pointToPercent({ x: event.clientX - rect.left, y: event.clientY - rect.top }, rect)
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    const point = getPoint(event)
    setStart(point)
    setEnd(point)
    setSelection(null)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!start) return
    setEnd(getPoint(event))
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!start) return
    const point = getPoint(event)
    setEnd(point)
    setSelection({
      x: Math.min(start.x, point.x),
      y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    })
    setStart(null)
  }

  const draft = end && start
    ? {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
        width: Math.abs(end.x - start.x),
        height: Math.abs(end.y - start.y),
      }
    : null

  const measuredRect = draft ?? selection
  const output = measuredRect
    ? JSON.stringify({
        x: round(measuredRect.x),
        y: round(measuredRect.y),
        width: round(measuredRect.width),
        height: round(measuredRect.height),
      })
    : 'Glissez sur un objet pour mesurer sa zone.'

  return (
    <div
      className={styles.overlay}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {hotspots.map((hotspot) => (
        <div
          key={hotspot.id}
          className={styles.existing}
          style={{
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            width: `${hotspot.width}%`,
            height: `${hotspot.height}%`,
          }}
        >
          <span>{hotspot.id}</span>
        </div>
      ))}
      {draft && (
        <div
          className={styles.draft}
          style={{
            left: `${draft.x}%`,
            top: `${draft.y}%`,
            width: `${draft.width}%`,
            height: `${draft.height}%`,
          }}
        />
      )}
      <div className={styles.readout} onPointerDown={(event) => event.stopPropagation()}>
        <code>{output}</code>
        {measuredRect && (
          <button type="button" onClick={() => navigator.clipboard.writeText(output)}>
            Copier
          </button>
        )}
      </div>
    </div>
  )
}
