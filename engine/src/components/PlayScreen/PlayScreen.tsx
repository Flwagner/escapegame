import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadManifest, loadScenario, resolveScenarioAssetUrl, resolveScenarioThemeUrl } from '../../core/loader/scenarioLoader'
import { useGameStore } from '../../core/state/gameStore'
import { audioManager } from '../../core/audio/audioManager'
import { findScene } from '../../core/engine/sceneEngine'
import { ThemeInjector } from '../../theming/ThemeInjector'
import { SceneView } from '../SceneView/SceneView'
import { PuzzleModal } from '../PuzzleModal/PuzzleModal'
import { ClueViewer } from '../ClueViewer/ClueViewer'
import { Inventory } from '../Inventory/Inventory'
import { ProgressBar } from '../ProgressBar/ProgressBar'
import type { Clue, Hotspot, Puzzle } from '../../types/scenario'
import styles from './PlayScreen.module.css'

export function PlayScreen() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  const navigate = useNavigate()

  const scenario = useGameStore((s) => s.scenario)
  const scenarioPath = useGameStore((s) => s.scenarioPath)
  const loadScenarioIntoStore = useGameStore((s) => s.loadScenario)
  const goToScene = useGameStore((s) => s.goToScene)
  const collectItem = useGameStore((s) => s.collectItem)
  const revealClue = useGameStore((s) => s.revealClue)
  const getCurrentProgress = useGameStore((s) => s.getCurrentProgress)
  const isSceneExitAllowed = useGameStore((s) => s.isSceneExitAllowed)

  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null)
  const [activeClue, setActiveClue] = useState<Clue | null>(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    if (!scenarioId) return
    let cancelled = false

    loadManifest()
      .then(async (manifest) => {
        const entry = manifest.scenarios.find((s) => s.id === scenarioId)
        if (!entry) throw new Error(`Scénario "${scenarioId}" introuvable dans le manifeste.`)
        const loaded = await loadScenario(entry)
        if (cancelled) return
        loadScenarioIntoStore(loaded, entry.path)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })

    return () => {
      cancelled = true
    }
  }, [scenarioId, loadScenarioIntoStore])

  const progress = getCurrentProgress()
  const currentScene = useMemo(
    () => (scenario && progress ? findScene(scenario.scenes, progress.currentSceneId) : undefined),
    [scenario, progress],
  )

  useEffect(() => {
    if (!started || !currentScene || !scenarioPath) return
    if (currentScene.ambientSound) {
      audioManager.playAmbient(resolveScenarioAssetUrl(scenarioPath, currentScene.ambientSound))
    } else {
      audioManager.stopAmbient()
    }
  }, [started, currentScene, scenarioPath])

  if (error) {
    return (
      <div className={styles.centered}>
        <p className={styles.error}>{error}</p>
        <button type="button" className="eg-tap-target" onClick={() => navigate('/')}>
          Retour à l'accueil
        </button>
      </div>
    )
  }

  if (!scenario || !scenarioPath || !progress || !currentScene) {
    return (
      <div className={styles.centered}>
        <p>Chargement du scénario…</p>
      </div>
    )
  }

  const themeHref = scenario.theme ? resolveScenarioThemeUrl(scenarioPath, scenario.theme) : null

  function handleStart() {
    audioManager.unlockAudioContext()
    setStarted(true)
  }

  function handleToggleMute() {
    const next = !muted
    audioManager.muteAll(next)
    setMuted(next)
  }

  function handleHotspotAction(hotspot: Hotspot) {
    const scene = currentScene!
    const action = hotspot.action
    audioManager.playEngineSfx('click')
    switch (action.kind) {
      case 'open-puzzle': {
        const puzzle = scene.puzzles.find((p) => p.id === action.puzzleId)
        if (puzzle) setActivePuzzle(puzzle)
        break
      }
      case 'show-clue': {
        const clue = scene.clues.find((c) => c.id === action.clueId)
        if (clue) {
          revealClue(clue.id)
          setActiveClue(clue)
          audioManager.playEngineSfx('reveal')
        }
        break
      }
      case 'go-to-scene': {
        if (isSceneExitAllowed()) {
          goToScene(action.sceneId)
        }
        break
      }
      case 'collect-item': {
        collectItem(action.itemId)
        audioManager.playEngineSfx('pickup')
        break
      }
    }
  }

  const totalPuzzles = scenario.scenes.reduce((acc, s) => acc + s.puzzles.length, 0)

  if (!started) {
    return (
      <div className={styles.startScreen}>
        {themeHref && <ThemeInjector href={themeHref} />}
        <h1>{scenario.title}</h1>
        {scenario.description && <p className={styles.description}>{scenario.description}</p>}
        <button type="button" className={`${styles.startButton} eg-tap-target`} onClick={handleStart}>
          Commencer l'enquête
        </button>
      </div>
    )
  }

  return (
    <div className={`scenario-${scenario.id} ${styles.wrapper}`}>
      {themeHref && <ThemeInjector href={themeHref} />}

      <header className={styles.header}>
        <button type="button" className={`${styles.backButton} eg-tap-target`} onClick={() => navigate('/')}>
          ← Quitter
        </button>
        <ProgressBar solvedCount={progress.solvedPuzzleIds.length} totalCount={totalPuzzles} />
        <button
          type="button"
          className={`${styles.muteButton} eg-tap-target`}
          onClick={handleToggleMute}
          aria-label={muted ? 'Réactiver le son' : 'Couper le son'}
          aria-pressed={muted}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      <main className={styles.main}>
        <SceneView scene={currentScene} scenarioPath={scenarioPath} onHotspotAction={handleHotspotAction} />
      </main>

      <Inventory items={scenario.items} collectedItemIds={progress.collectedItemIds} scenarioPath={scenarioPath} />

      <PuzzleModal
        puzzle={activePuzzle}
        onClose={() => setActivePuzzle(null)}
        onSolved={() => setActivePuzzle(null)}
      />
      <ClueViewer clue={activeClue} scenarioPath={scenarioPath} onClose={() => setActiveClue(null)} />
    </div>
  )
}
