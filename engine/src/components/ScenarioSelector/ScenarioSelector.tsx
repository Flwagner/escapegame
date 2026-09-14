import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadManifest } from '../../core/loader/scenarioLoader'
import { hasSavedProgress } from '../../core/state/persist'
import type { Manifest, ManifestEntry } from '../../types/scenario'
import styles from './ScenarioSelector.module.css'

export function ScenarioSelector() {
  const navigate = useNavigate()
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadManifest()
      .then(setManifest)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
  }, [])

  if (error) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.error}>Erreur de chargement des scénarios : {error}</p>
      </div>
    )
  }

  if (!manifest) {
    return (
      <div className={styles.wrapper}>
        <p>Chargement des scénarios…</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Choisissez une enquête</h1>
      <div className={styles.grid}>
        {manifest.scenarios.map((entry: ManifestEntry) => (
          <button
            key={entry.id}
            type="button"
            className={styles.card}
            onClick={() => navigate(`/play/${entry.id}`)}
          >
            {entry.thumbnail ? (
              <img
                className={styles.thumbnail}
                src={`${import.meta.env.BASE_URL}scenarios/${entry.path}/${entry.thumbnail}`}
                alt=""
              />
            ) : (
              <div className={styles.thumbnailPlaceholder} aria-hidden="true" />
            )}
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{entry.title}</h2>
              {entry.description && <p className={styles.cardDescription}>{entry.description}</p>}
              <div className={styles.meta}>
                {entry.difficulty && <span className={styles.badge}>{entry.difficulty}</span>}
                {entry.estimatedDurationMinutes && (
                  <span className={styles.badge}>{entry.estimatedDurationMinutes} min</span>
                )}
                {hasSavedProgress(entry.id) && (
                  <span className={styles.badgeContinue}>Reprendre</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
