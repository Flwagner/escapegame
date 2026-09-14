import { useGesture } from '@use-gesture/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { clampPan, clampScale, nextDoubleTapScale } from './zoomMath'
import styles from './Lightbox.module.css'

interface LightboxProps {
  src: string
  alt: string
  onClose: () => void
}

/**
 * Visionneuse plein écran avec zoom (pinch/molette) et déplacement (pan),
 * pour examiner les détails d'une image (indice, fond de scène, document
 * scanné). Générique, sans dépendance à un scénario particulier.
 */
export function Lightbox({ src, alt, onClose }: LightboxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })

  function getBounds() {
    const container = containerRef.current
    const img = container?.querySelector('img')
    if (!container || !img) return null
    return {
      containerWidth: container.clientWidth,
      containerHeight: container.clientHeight,
      contentWidth: img.clientWidth,
      contentHeight: img.clientHeight,
    }
  }

  function applyTransform(next: { scale: number; x: number; y: number }) {
    const bounds = getBounds()
    const scale = clampScale(next.scale)
    if (!bounds) {
      setTransform({ scale, x: next.x, y: next.y })
      return
    }
    const x = clampPan(next.x, { containerSize: bounds.containerWidth, contentSize: bounds.contentWidth, scale })
    const y = clampPan(next.y, { containerSize: bounds.containerHeight, contentSize: bounds.contentHeight, scale })
    setTransform({ scale, x, y })
  }

  function handleDoubleTap() {
    setTransform((prev) => {
      const scale = nextDoubleTapScale(prev.scale)
      return scale === 1 ? { scale, x: 0, y: 0 } : { ...prev, scale }
    })
  }

  useGesture(
    {
      onDrag: ({ offset: [ox, oy], pinching }) => {
        if (pinching) return
        applyTransform({ ...transform, x: ox, y: oy })
      },
      onPinch: ({ offset: [s] }) => {
        applyTransform({ ...transform, scale: s })
      },
      onWheel: ({ delta: [, dy] }) => {
        applyTransform({ ...transform, scale: transform.scale - dy / 300 })
      },
    },
    {
      target: containerRef,
      drag: { from: () => [transform.x, transform.y] },
      pinch: { scaleBounds: { min: 1, max: 4 }, from: () => [transform.scale, 0] },
      eventOptions: { passive: false },
    },
  )

  return (
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <button type="button" className={`${styles.closeButton} eg-tap-target`} onClick={onClose} aria-label="Fermer">
          ✕
        </button>
        <div
          ref={containerRef}
          className={styles.viewport}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleTap}
        >
          <motion.img
            src={src}
            alt={alt}
            className={styles.image}
            draggable={false}
            animate={{ x: transform.x, y: transform.y, scale: transform.scale }}
            transition={{ type: 'tween', duration: 0.05 }}
          />
        </div>
        <p className={styles.hint}>Pincez ou double-tapez pour zoomer</p>
      </motion.div>
    </AnimatePresence>
  )
}
