import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { resolveScenarioAssetUrl } from '../../core/loader/scenarioLoader'
import { DocumentViewer } from '../DocumentViewer/DocumentViewer'
import { Lightbox } from '../Lightbox/Lightbox'
import type { Clue } from '../../types/scenario'
import styles from './ClueViewer.module.css'

interface ClueViewerProps {
  clue: Clue | null
  scenarioPath: string
  onClose: () => void
}

export function ClueViewer({ clue, scenarioPath, onClose }: ClueViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!clue) return null

  const imageUrl = clue.type === 'image' ? resolveScenarioAssetUrl(scenarioPath, clue.content) : null

  return (
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.panel}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className={`${styles.closeButton} eg-tap-target`} onClick={onClose} aria-label="Fermer">
            ✕
          </button>
          <h2 className={styles.title}>{clue.title}</h2>

          {clue.type === 'text' && <DocumentViewer clue={clue} scenarioPath={scenarioPath} />}

          {clue.type === 'image' && imageUrl && (
            <button
              type="button"
              className={`${styles.imageButton} eg-tap-target`}
              onClick={() => setLightboxOpen(true)}
              aria-label="Agrandir l'image"
            >
              <img className={styles.image} src={imageUrl} alt={clue.alt ?? clue.title} />
            </button>
          )}

          {clue.type === 'audio' && (
            <audio className={styles.audio} controls src={resolveScenarioAssetUrl(scenarioPath, clue.content)} />
          )}

          {clue.type === 'document' && <DocumentViewer clue={clue} scenarioPath={scenarioPath} />}
        </motion.div>
      </motion.div>
      {lightboxOpen && imageUrl && (
        <Lightbox src={imageUrl} alt={clue.alt ?? clue.title} onClose={() => setLightboxOpen(false)} />
      )}
    </AnimatePresence>
  )
}
