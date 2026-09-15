import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadManifest, loadScenario, resolveScenarioAssetUrl, resolveScenarioThemeUrl } from '../../core/loader/scenarioLoader'
import { useGameStore } from '../../core/state/gameStore'
import { hasSavedProgress } from '../../core/state/persist'
import { audioManager } from '../../core/audio/audioManager'
import { findScene } from '../../core/engine/sceneEngine'
import { ThemeInjector } from '../../theming/ThemeInjector'
import { SceneView } from '../SceneView/SceneView'
import { PuzzleModal } from '../PuzzleModal/PuzzleModal'
import { ClueViewer } from '../ClueViewer/ClueViewer'
import { Inventory } from '../Inventory/Inventory'
import { ProgressBar } from '../ProgressBar/ProgressBar'
import { GameTimer } from '../GameTimer/GameTimer'
import { formatRemainingTime, getRemainingSeconds } from '../GameTimer/timerUtils'
import type { Clue, Hotspot, Puzzle } from '../../types/scenario'
import styles from './PlayScreen.module.css'

export function PlayScreen() {
  const { scenarioId } = useParams<{ scenarioId: string }>()
  return <PlayScreenSession key={scenarioId} scenarioId={scenarioId} />
}

function PlayScreenSession({ scenarioId }: { scenarioId?: string }) {
  const navigate = useNavigate()

  const scenario = useGameStore((s) => s.scenario)
  const scenarioPath = useGameStore((s) => s.scenarioPath)
  const loadScenarioIntoStore = useGameStore((s) => s.loadScenario)
  const goToScene = useGameStore((s) => s.goToScene)
  const collectItem = useGameStore((s) => s.collectItem)
  const activateHotspotWithItem = useGameStore((s) => s.activateHotspotWithItem)
  const revealClue = useGameStore((s) => s.revealClue)
  const isSceneExitAllowed = useGameStore((s) => s.isSceneExitAllowed)
  const isClueUnlocked = useGameStore((s) => s.isClueUnlocked)
  const unloadScenario = useGameStore((s) => s.unloadScenario)
  const resetProgress = useGameStore((s) => s.resetProgress)
  const startTimer = useGameStore((s) => s.startTimer)
  const pauseTimer = useGameStore((s) => s.pauseTimer)
  const resumeTimer = useGameStore((s) => s.resumeTimer)
  const checkTimerExpired = useGameStore((s) => s.checkTimerExpired)
  const progress = useGameStore((s) =>
    s.scenario ? (s.progressByScenario[s.scenario.id] ?? null) : null,
  )
  const pausedAt = progress?.pausedAt ?? null
  const outcome = progress?.outcome ?? null

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null)
  const [activeClue, setActiveClue] = useState<Clue | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [muted, setMuted] = useState(() => audioManager.isMuted())
  const [hadSavedProgress, setHadSavedProgress] = useState(() => Boolean(scenarioId && hasSavedProgress(scenarioId)))
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  useEffect(() => {
    if (!scenarioId) return
    let cancelled = false

    unloadScenario()

    loadManifest()
      .then(async (manifest) => {
        const entry = manifest.scenarios.find((s) => s.id === scenarioId)
        if (!entry) throw new Error(`Scénario "${scenarioId}" introuvable dans le manifeste.`)
        const loaded = await loadScenario(entry)
        if (cancelled) return
        loadScenarioIntoStore(loaded, entry.path)
        setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err))
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [scenarioId, loadScenarioIntoStore, unloadScenario])

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

  useEffect(() => () => audioManager.stopAmbient(0), [])

  useEffect(() => {
    const pauseOnExit = () => useGameStore.getState().pauseTimer()
    window.addEventListener('pagehide', pauseOnExit)
    return () => {
      window.removeEventListener('pagehide', pauseOnExit)
      pauseOnExit()
    }
  }, [])

  useEffect(() => {
    if (!progress?.timerDeadlineAt) return
    checkTimerExpired()
  }, [checkTimerExpired, progress?.timerDeadlineAt])

  useEffect(() => {
    if (pausedAt === null && outcome === null) return
    audioManager.stopAmbient()
  }, [outcome, pausedAt])

  useEffect(() => {
    if (!statusMessage) return
    const timeout = window.setTimeout(() => setStatusMessage(''), 3500)
    return () => window.clearTimeout(timeout)
  }, [statusMessage])

  useEffect(() => {
    if (started || !progress?.timerDeadlineAt || progress.pausedAt !== null || progress.outcome !== null) return
    const update = () => setCurrentTime(Date.now())
    update()
    const interval = window.setInterval(update, 250)
    return () => window.clearInterval(interval)
  }, [started, progress?.outcome, progress?.pausedAt, progress?.timerDeadlineAt])

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

  if (loading || !scenario || !scenarioPath || !progress || !currentScene) {
    return (
      <div className={styles.centered}>
        <p>Chargement du scénario…</p>
      </div>
    )
  }

  const themeHref = scenario.theme ? resolveScenarioThemeUrl(scenarioPath, scenario.theme) : null
  const remainingTime = progress.timerDeadlineAt === null
    ? null
    : formatRemainingTime(getRemainingSeconds(progress.timerDeadlineAt, progress.pausedAt ?? currentTime))

  function handleStart() {
    audioManager.unlockAudioContext()
    startTimer()
    setStarted(true)
  }

  function handlePause() {
    setActivePuzzle(null)
    setActiveClue(null)
    setSelectedItemId(null)
    pauseTimer()
  }

  function handleResume() {
    audioManager.unlockAudioContext()
    resumeTimer()
    setStarted(true)
  }

  function handleQuit() {
    pauseTimer()
    navigate('/')
  }

  function handleRestart() {
    audioManager.stopAmbient()
    resetProgress()
    setHadSavedProgress(false)
    setStarted(false)
  }

  function handleConfirmedRestart() {
    if (!window.confirm('Recommencer depuis le début ? Votre progression sera effacée.')) return
    handleRestart()
  }

  function handleToggleMute() {
    const next = !muted
    audioManager.muteAll(next)
    setMuted(next)
  }

  function handleHotspotAction(hotspot: Hotspot) {
    const scene = currentScene!
    const loadedScenario = scenario!
    const currentProgress = progress!
    if (currentProgress.outcome !== null || currentProgress.pausedAt !== null) return
    const action = hotspot.action
    audioManager.playEngineSfx('click')

    const actionAvailable = (() => {
      switch (action.kind) {
        case 'open-puzzle':
          return scene.puzzles.some((puzzle) => puzzle.id === action.puzzleId)
        case 'show-clue':
          return scene.clues.some((clue) => clue.id === action.clueId) && isClueUnlocked(action.clueId)
        case 'go-to-scene':
          return Boolean(findScene(loadedScenario.scenes, action.sceneId)) && isSceneExitAllowed()
        case 'collect-item':
          return (
            loadedScenario.items.some((item) => item.id === action.itemId) &&
            !currentProgress.collectedItemIds.includes(action.itemId) &&
            !currentProgress.consumedItemIds.includes(action.itemId)
          )
      }
    })()

    if (!actionAvailable) {
      setStatusMessage('Cette action n’est pas encore possible.')
      audioManager.playEngineSfx('error')
      return
    }

    const alreadyUsed = currentProgress.usedHotspotIds.includes(hotspot.id)
    if (hotspot.useItemId && !alreadyUsed) {
      if (!selectedItemId) {
        setStatusMessage('Sélectionnez un objet dans l’inventaire.')
        audioManager.playEngineSfx('error')
        return
      }
      if (selectedItemId !== hotspot.useItemId) {
        setStatusMessage('Cet objet ne convient pas ici.')
        audioManager.playEngineSfx('error')
        return
      }
      const item = loadedScenario.items.find((candidate) => candidate.id === selectedItemId)
      if (!activateHotspotWithItem(hotspot.id, selectedItemId)) {
        setStatusMessage('Cet objet ne peut pas être utilisé ici.')
        audioManager.playEngineSfx('error')
        return
      }
      setSelectedItemId(null)
      setStatusMessage(`${item?.name ?? 'Objet'} utilisé.`)
      audioManager.playEngineSfx('unlock')
    }

    switch (action.kind) {
      case 'open-puzzle': {
        const puzzle = scene.puzzles.find((p) => p.id === action.puzzleId)
        if (puzzle) setActivePuzzle(puzzle)
        break
      }
      case 'show-clue': {
        const clue = scene.clues.find((c) => c.id === action.clueId)
        if (clue && isClueUnlocked(clue.id)) {
          revealClue(clue.id)
          setActiveClue(clue)
          audioManager.playEngineSfx('reveal')
        } else if (clue) {
          audioManager.playEngineSfx('error')
        }
        break
      }
      case 'go-to-scene': {
        setSelectedItemId(null)
        goToScene(action.sceneId)
        break
      }
      case 'collect-item': {
        if (collectItem(action.itemId)) {
          const item = loadedScenario.items.find((candidate) => candidate.id === action.itemId)
          setStatusMessage(`${item?.name ?? 'Objet'} ajouté à l’inventaire.`)
          audioManager.playEngineSfx('pickup')
        }
        break
      }
    }
  }

  const puzzleIds = new Set(scenario.scenes.flatMap((scene) => scene.puzzles.map((puzzle) => puzzle.id)))
  const solvedPuzzleCount = new Set(progress.solvedPuzzleIds.filter((id) => puzzleIds.has(id))).size

  if (progress.outcome === 'lost') {
    return (
      <div className={`scenario-${scenario.id} ${styles.endScreen}`}>
        {themeHref && <ThemeInjector href={themeHref} />}
        <p className={styles.endEyebrow}>Temps écoulé</p>
        <h1>Partie perdue</h1>
        <p>Le compte à rebours est arrivé à zéro.</p>
        <div className={styles.endActions}>
          <button type="button" className={`${styles.primaryButton} eg-tap-target`} onClick={handleRestart}>
            Recommencer
          </button>
          <button type="button" className={`${styles.secondaryButton} eg-tap-target`} onClick={handleQuit}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  if (progress.pausedAt !== null && progress.timerDeadlineAt !== null) {
    return (
      <div className={`scenario-${scenario.id} ${styles.pauseScreen}`}>
        {themeHref && <ThemeInjector href={themeHref} />}
        <GameTimer
          deadlineAt={progress.timerDeadlineAt}
          pausedAt={progress.pausedAt}
          stoppedAt={null}
          outcome={null}
          onExpire={checkTimerExpired}
        />
        <h1>Partie en pause</h1>
        <p>Le jeu et le minuteur sont suspendus.</p>
        <div className={styles.endActions}>
          <button type="button" className={`${styles.primaryButton} eg-tap-target`} onClick={handleResume}>
            Reprendre l'enquête{remainingTime ? ` (${remainingTime})` : ''}
          </button>
          <button type="button" className={`${styles.secondaryButton} eg-tap-target`} onClick={handleConfirmedRestart}>
            Recommencer
          </button>
          <button type="button" className={`${styles.secondaryButton} eg-tap-target`} onClick={handleQuit}>
            Quitter
          </button>
        </div>
      </div>
    )
  }

  if (!started && progress.outcome !== 'won') {
    return (
      <div className={`scenario-${scenario.id} ${styles.startScreen}`}>
        {themeHref && <ThemeInjector href={themeHref} />}
        <h1>{scenario.title}</h1>
        {scenario.description && <p className={styles.description}>{scenario.description}</p>}
        {progress.timerDeadlineAt !== null && (
          <GameTimer
            deadlineAt={progress.timerDeadlineAt}
            pausedAt={null}
            stoppedAt={null}
            outcome={null}
            onExpire={checkTimerExpired}
          />
        )}
        <div className={styles.endActions}>
          <button type="button" className={`${styles.startButton} eg-tap-target`} onClick={handleStart}>
            {hadSavedProgress
              ? `Reprendre l'enquête${remainingTime ? ` (${remainingTime})` : ''}`
              : "Commencer l'enquête"}
          </button>
          {hadSavedProgress && (
            <button type="button" className={`${styles.secondaryButton} eg-tap-target`} onClick={handleConfirmedRestart}>
              Recommencer depuis le début
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`scenario-${scenario.id} ${styles.wrapper}`}>
      {themeHref && <ThemeInjector href={themeHref} />}

      <header className={styles.header}>
        <button type="button" className={`${styles.backButton} eg-tap-target`} onClick={handleQuit}>
          ← Quitter
        </button>
        <div className={styles.hud}>
          <ProgressBar solvedCount={solvedPuzzleCount} totalCount={puzzleIds.size} />
          {progress.timerDeadlineAt !== null && (
            <GameTimer
              deadlineAt={progress.timerDeadlineAt}
              pausedAt={null}
              stoppedAt={progress.finishedAt}
              outcome={progress.outcome}
              onExpire={checkTimerExpired}
            />
          )}
        </div>
        {scenario.timer && progress.outcome === null && (
          <button type="button" className={`${styles.pauseButton} eg-tap-target`} onClick={handlePause}>
            Pause
          </button>
        )}
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

      {progress.outcome === 'won' && (
        <div className={styles.victoryStatus} role="status">
          Partie gagnée, minuteur arrêté.
        </div>
      )}

      {statusMessage && (
        <div className={styles.status} role="status" aria-live="polite">
          {statusMessage}
        </div>
      )}

      {progress.outcome === null && (
        <Inventory
          items={scenario.items}
          collectedItemIds={progress.collectedItemIds}
          consumedItemIds={progress.consumedItemIds}
          scenarioPath={scenarioPath}
          selectedItemId={selectedItemId}
          onSelectItem={(itemId) => {
            setSelectedItemId(itemId)
            const item = scenario.items.find((candidate) => candidate.id === itemId)
            setStatusMessage(item ? `${item.name} sélectionné.` : 'Objet désélectionné.')
          }}
        />
      )}

      <PuzzleModal
        puzzle={activePuzzle}
        onClose={() => setActivePuzzle(null)}
        onSolved={() => setActivePuzzle(null)}
      />
      <ClueViewer clue={activeClue} scenarioPath={scenarioPath} onClose={() => setActiveClue(null)} />
    </div>
  )
}
