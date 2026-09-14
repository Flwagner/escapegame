import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { resolveScenarioAssetUrl } from '../../core/loader/scenarioLoader'
import { useGameStore } from '../../core/state/gameStore'
import { Lightbox } from '../Lightbox/Lightbox'
import type { Hotspot, Scene } from '../../types/scenario'
import styles from './SceneView.module.css'

interface SceneViewProps {
  scene: Scene
  scenarioPath: string
  onHotspotAction: (hotspot: Hotspot) => void
}

export function SceneView({ scene, scenarioPath, onHotspotAction }: SceneViewProps) {
  const isHotspotUnlocked = useGameStore((s) => s.isHotspotUnlocked)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const backgroundUrl = useMemo(
    () => (scene.background ? resolveScenarioAssetUrl(scenarioPath, scene.background) : undefined),
    [scene.background, scenarioPath],
  )

  return (
    <>
      <motion.div
        key={scene.id}
        className={styles.scene}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
      >
        <div className={styles.overlay}>
          {scene.narrative && <p className={styles.narrative}>{scene.narrative}</p>}
        </div>

        {backgroundUrl && (
          <button
            type="button"
            className={`${styles.zoomButton} eg-tap-target`}
            onClick={() => setLightboxOpen(true)}
            aria-label="Examiner la scène en détail"
          >
            🔍
          </button>
        )}

        <div className={styles.hotspotLayer}>
          {scene.hotspots.map((hotspot) => {
            const visible = isHotspotUnlocked(hotspot.id)
            if (!visible) return null
            return (
              <button
                key={hotspot.id}
                type="button"
                className={`${styles.hotspot} eg-tap-target`}
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
      </motion.div>
      {lightboxOpen && backgroundUrl && (
        <Lightbox src={backgroundUrl} alt={scene.title} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  )
}
