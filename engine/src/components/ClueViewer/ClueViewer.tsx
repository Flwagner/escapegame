import { AnimatePresence, motion } from 'framer-motion'
import { resolveScenarioAssetUrl } from '../../core/loader/scenarioLoader'
import type { Clue } from '../../types/scenario'
import styles from './ClueViewer.module.css'

interface ClueViewerProps {
  clue: Clue | null
  scenarioPath: string
  onClose: () => void
}

export function ClueViewer({ clue, scenarioPath, onClose }: ClueViewerProps) {
  if (!clue) return null

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

          {clue.type === 'text' && <p className={styles.text}>{clue.content}</p>}

          {clue.type === 'image' && (
            <img
              className={styles.image}
              src={resolveScenarioAssetUrl(scenarioPath, clue.content)}
              alt={clue.alt ?? clue.title}
            />
          )}

          {clue.type === 'audio' && (
            <audio className={styles.audio} controls src={resolveScenarioAssetUrl(scenarioPath, clue.content)} />
          )}

          {clue.type === 'document' && (
            <a
              className={styles.docLink}
              href={resolveScenarioAssetUrl(scenarioPath, clue.content)}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir le document
            </a>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
