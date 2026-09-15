import { resolveScenarioAssetUrl } from '../../core/loader/scenarioLoader'
import type { Clue } from '../../types/scenario'
import { isImageAsset } from './assetType'
import styles from './DocumentViewer.module.css'

interface DocumentViewerProps {
  clue: Clue
  scenarioPath: string
}

/**
 * Rendu "papier" pour les indices de type texte (lettre manuscrite) ou
 * document (scan/rapport). Remplace le simple lien/paragraphe générique
 * pour un rendu plus immersif, tout en restant générique et paramétrable
 * par les données JSON du scénario (`documentStyle`).
 */
export function DocumentViewer({ clue, scenarioPath }: DocumentViewerProps) {
  const style = clue.documentStyle ?? (clue.type === 'document' ? 'scan' : 'letter')
  const assetUrl = clue.type === 'document' ? resolveScenarioAssetUrl(scenarioPath, clue.content) : null
  const isImage = clue.type === 'document' && isImageAsset(clue.content)

  return (
    <div className={`${styles.paper} ${styles[style]}`}>
      {clue.type === 'text' && <p className={styles.text}>{clue.content}</p>}

      {clue.type === 'document' && assetUrl && isImage && (
        <img className={styles.scanImage} src={assetUrl} alt={clue.alt ?? clue.title} />
      )}

      {clue.type === 'document' && assetUrl && !isImage && (
        <a className={styles.docLink} href={assetUrl} target="_blank" rel="noreferrer">
          Ouvrir le document
        </a>
      )}
    </div>
  )
}
