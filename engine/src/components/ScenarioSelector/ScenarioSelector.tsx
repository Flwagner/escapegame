import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadManifest } from '../../core/loader/scenarioLoader'
import { clearScenarioSave, hasSavedProgress } from '../../core/state/persist'
import type { Manifest, ManifestEntry } from '../../types/scenario'
import styles from './ScenarioSelector.module.css'

export function ScenarioSelector() {
  const navigate = useNavigate()
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [error, setError] = useState<string | null>(null)

  function restartScenario(entry: ManifestEntry) {
    if (!window.confirm(`Recommencer « ${entry.title} » depuis le début ? Votre progression sera effacée.`)) return
    clearScenarioSave(entry.id)
    navigate(`/play/${entry.id}`)
  }

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
        {manifest.scenarios.map((entry: ManifestEntry) => {
          const hasProgress = hasSavedProgress(entry.id)
          return (
            <article key={entry.id} className={styles.card}>
              <button
                type="button"
                className={styles.cardLink}
                onClick={() => navigate(`/play/${entry.id}`)}
                aria-label={`${hasProgress ? 'Reprendre' : 'Commencer'} : ${entry.title}`}
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
                    {hasProgress && <span className={styles.badgeContinue}>Reprendre</span>}
                  </div>
                </div>
              </button>
              {hasProgress && (
                <button
                  type="button"
                  className={`${styles.restartButton} eg-tap-target`}
                  onClick={() => restartScenario(entry)}
                >
                  Recommencer depuis le début
                </button>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
