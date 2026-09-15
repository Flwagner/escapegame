import { useGesture } from '@use-gesture/react'
import { motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { resolveScenarioAssetUrl } from '../../core/loader/scenarioLoader'
import { useGameStore } from '../../core/state/gameStore'
import type { Hotspot, Scene } from '../../types/scenario'
import { getContainedSize } from './sceneGeometry'
import { clampPan, clampScale } from './sceneZoomMath'
import styles from './SceneView.module.css'

const HotspotDebugOverlay = import.meta.env.DEV
  ? lazy(async () => {
      const module = await import('./HotspotDebugOverlay')
      return { default: module.HotspotDebugOverlay }
    })
  : null

interface SceneViewProps {
  scene: Scene
  scenarioPath: string
  onHotspotAction: (hotspot: Hotspot) => void
}

export function SceneView({ scene, scenarioPath, onHotspotAction }: SceneViewProps) {
  const isHotspotUnlocked = useGameStore((s) => s.isHotspotUnlocked)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })

  const backgroundUrl = useMemo(
    () => (scene.background ? resolveScenarioAssetUrl(scenarioPath, scene.background) : undefined),
    [scene.background, scenarioPath],
  )

  const stageSize = getContainedSize(viewportSize, imageSize)
  const debugEnabled = import.meta.env.DEV && (() => {
    const pageQuery = new URLSearchParams(window.location.search)
    const hashQuery = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
    return pageQuery.get('hotspots') === '1' || hashQuery.get('hotspots') === '1'
  })()

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const updateSize = () => {
      const nextViewportSize = { width: viewport.clientWidth, height: viewport.clientHeight }
      const nextStageSize = getContainedSize(nextViewportSize, imageSize)
      setViewportSize(nextViewportSize)
      setTransform((current) => ({
        ...current,
        x: clampPan(current.x, {
          containerSize: nextViewportSize.width,
          contentSize: nextStageSize.width,
          scale: current.scale,
        }),
        y: clampPan(current.y, {
          containerSize: nextViewportSize.height,
          contentSize: nextStageSize.height,
          scale: current.scale,
        }),
      }))
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [imageSize])

  function applyTransform(next: { scale: number; x: number; y: number }) {
    const scale = clampScale(next.scale)
    setTransform({
      scale,
      x: clampPan(next.x, { containerSize: viewportSize.width, contentSize: stageSize.width, scale }),
      y: clampPan(next.y, { containerSize: viewportSize.height, contentSize: stageSize.height, scale }),
    })
  }

  function setScale(scale: number) {
    if (scale <= 1) {
      setTransform({ scale: 1, x: 0, y: 0 })
      return
    }
    applyTransform({ ...transform, scale })
  }

  useGesture(
    {
      onDrag: ({ offset: [x, y], pinching }) => {
        if (!pinching && transform.scale > 1) applyTransform({ ...transform, x, y })
      },
      onDragStart: ({ event, cancel }) => {
        if ((event.target as Element).closest('button')) cancel()
      },
      onPinch: ({ offset: [scale] }) => applyTransform({ ...transform, scale }),
      onWheel: ({ delta: [, y] }) => setScale(transform.scale - y / 400),
    },
    {
      target: viewportRef,
      drag: { from: () => [transform.x, transform.y], filterTaps: true },
      pinch: { scaleBounds: { min: 1, max: 4 }, from: () => [transform.scale, 0] },
      eventOptions: { passive: false },
    },
  )

  return (
    <motion.div
        key={scene.id}
        className={styles.scene}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        data-scene-id={scene.id}
      >
        {backgroundUrl && <img src={backgroundUrl} alt="" className={styles.ambientBackground} aria-hidden="true" />}
        <div ref={viewportRef} className={styles.viewport}>
          {backgroundUrl && (
            <motion.div
              className={styles.stage}
              style={stageSize.width > 0 ? { width: stageSize.width, height: stageSize.height } : undefined}
              animate={{ x: transform.x, y: transform.y, scale: transform.scale }}
              transition={{ type: 'tween', duration: 0.05 }}
            >
              <img
                key={backgroundUrl}
                src={backgroundUrl}
                alt=""
                className={styles.background}
                draggable={false}
                onLoad={(event) => {
                  setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })
                  setTransform({ scale: 1, x: 0, y: 0 })
                }}
              />

              <div className={styles.hotspotLayer}>
                {scene.hotspots.map((hotspot) => {
                  const visible = isHotspotUnlocked(hotspot.id)
                  if (!visible || debugEnabled) return null
                  return (
                    <button
                      key={hotspot.id}
                      type="button"
                      className={styles.hotspot}
                      style={{
                        left: `${hotspot.x}%`,
                        top: `${hotspot.y}%`,
                        width: `${hotspot.width}%`,
                        height: `${hotspot.height}%`,
                      }}
                      aria-label={hotspot.label ?? 'Zone interactive'}
                      onClick={() => onHotspotAction(hotspot)}
                    >
                      {hotspot.label && <span className={styles.hotspotLabel}>{hotspot.label}</span>}
                    </button>
                  )
                })}
              </div>

              {debugEnabled && HotspotDebugOverlay && (
                <Suspense fallback={null}>
                  <HotspotDebugOverlay hotspots={scene.hotspots} />
                </Suspense>
              )}
            </motion.div>
          )}
        </div>

        <div className={styles.overlay}>
          {scene.narrative && <p className={styles.narrative}>{scene.narrative}</p>}
        </div>

        {backgroundUrl && !debugEnabled && (
          <div className={styles.zoomControls} aria-label="Zoom de la scène">
            <button type="button" onClick={() => setScale(transform.scale - 0.5)} aria-label="Dézoomer">−</button>
            <button type="button" onClick={() => setScale(transform.scale + 0.5)} aria-label="Zoomer">+</button>
          </div>
        )}
    </motion.div>
  )
}
