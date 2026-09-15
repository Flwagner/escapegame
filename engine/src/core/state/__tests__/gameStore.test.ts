import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Scenario } from '../../../types/scenario'
import { migratePersistedGameState, useGameStore } from '../gameStore'

const scenario: Scenario = {
  schemaVersion: 2,
  id: 'demo',
  title: 'Démo',
  introSceneId: 'scene-1',
  timer: { durationSeconds: 300, victorySceneId: 'scene-2' },
  items: [],
  scenes: [
    { id: 'scene-1', title: 'Scène 1', hotspots: [], clues: [], puzzles: [] },
    { id: 'scene-2', title: 'Scène 2', hotspots: [], clues: [], puzzles: [] },
  ],
}

const inventoryScenario: Scenario = {
  schemaVersion: 2,
  id: 'inventory-demo',
  title: 'Inventaire',
  introSceneId: 'scene-1',
  timer: { durationSeconds: 300, victorySceneId: 'scene-2' },
  items: [{ id: 'cle', name: 'Clé' }],
  scenes: [
    {
      id: 'scene-1',
      title: 'Scène 1',
      hotspots: [
        {
          id: 'porte',
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          action: { kind: 'go-to-scene', sceneId: 'scene-2' },
          useItemId: 'cle',
        },
      ],
      clues: [],
      puzzles: [
        {
          id: 'enigme',
          type: 'text-match',
          prompt: 'Réponse ?',
          answers: ['oui'],
          caseSensitive: false,
          rewards: { unlockItems: ['cle'] },
        },
      ],
    },
    { id: 'scene-2', title: 'Scène 2', hotspots: [], clues: [], puzzles: [] },
  ],
}

const timedScenario: Scenario = {
  schemaVersion: 2,
  id: 'timed-demo',
  title: 'Chronomètre',
  introSceneId: 'scene-1',
  timer: { durationSeconds: 60, victorySceneId: 'scene-finale' },
  items: [],
  scenes: [
    {
      id: 'scene-1',
      title: 'Scène 1',
      hotspots: [],
      clues: [],
      puzzles: [{
        id: 'enigme-chrono',
        type: 'text-match',
        prompt: 'Réponse ?',
        answers: ['oui'],
        caseSensitive: false,
        failurePenaltySeconds: 15,
      }],
    },
    { id: 'scene-finale', title: 'Fin', hotspots: [], clues: [], puzzles: [] },
  ],
}

describe('gameStore', () => {
  beforeEach(() => {
    vi.useRealTimers()
    localStorage.clear()
    useGameStore.setState({ scenario: null, scenarioPath: null, progressByScenario: {} })
  })

  it('publie immédiatement un changement de scène dans la progression', () => {
    useGameStore.getState().loadScenario(scenario, 'demo')
    useGameStore.getState().goToScene('scene-2')

    expect(useGameStore.getState().progressByScenario.demo.currentSceneId).toBe('scene-2')
  })

  it('ignore une destination de scène inconnue', () => {
    useGameStore.getState().loadScenario(scenario, 'demo')
    useGameStore.getState().goToScene('scene-inconnue')

    expect(useGameStore.getState().progressByScenario.demo.currentSceneId).toBe('scene-1')
  })

  it('répare une scène sauvegardée qui n’existe plus', () => {
    useGameStore.setState({
      progressByScenario: {
        demo: {
          currentSceneId: 'ancienne-scene',
          solvedPuzzleIds: [],
          collectedItemIds: [],
          consumedItemIds: [],
          usedHotspotIds: [],
          unlockedClueIds: [],
          attemptsByPuzzleId: {},
          startedAt: 1,
          finishedAt: null,
          timerDeadlineAt: null,
          pausedAt: null,
          outcome: null,
        },
      },
    })

    useGameStore.getState().loadScenario(scenario, 'demo')

    expect(useGameStore.getState().progressByScenario.demo.currentSceneId).toBe('scene-1')
  })

  it('consomme un objet et mémorise durablement le hotspot activé', () => {
    useGameStore.getState().loadScenario(inventoryScenario, 'inventory-demo')

    expect(useGameStore.getState().collectItem('cle')).toBe(true)
    expect(useGameStore.getState().activateHotspotWithItem('porte', 'cle')).toBe(true)

    const progress = useGameStore.getState().progressByScenario['inventory-demo']
    expect(progress.collectedItemIds).toContain('cle')
    expect(progress.consumedItemIds).toEqual(['cle'])
    expect(progress.usedHotspotIds).toEqual(['porte'])
  })

  it('ne permet pas de récupérer à nouveau un objet consommé', () => {
    useGameStore.getState().loadScenario(inventoryScenario, 'inventory-demo')
    useGameStore.getState().collectItem('cle')
    useGameStore.getState().activateHotspotWithItem('porte', 'cle')

    expect(useGameStore.getState().collectItem('cle')).toBe(false)
    useGameStore.getState().attemptPuzzle('enigme', 'oui')

    const progress = useGameStore.getState().progressByScenario['inventory-demo']
    expect(progress.collectedItemIds.filter((id) => id === 'cle')).toHaveLength(1)
    expect(progress.consumedItemIds).toEqual(['cle'])
  })

  it('refuse un mauvais objet ou un objet non possédé', () => {
    useGameStore.getState().loadScenario(inventoryScenario, 'inventory-demo')

    expect(useGameStore.getState().activateHotspotWithItem('porte', 'cle')).toBe(false)
    expect(useGameStore.getState().activateHotspotWithItem('porte', 'autre')).toBe(false)
  })

  it('migre une sauvegarde historique sans état de consommation', () => {
    const migrated = migratePersistedGameState({
      scenarioPath: 'demo',
      progressByScenario: {
        demo: {
          currentSceneId: 'scene-1',
          solvedPuzzleIds: [],
          collectedItemIds: ['cle'],
          unlockedClueIds: [],
          attemptsByPuzzleId: {},
          startedAt: 1,
          finishedAt: null,
        },
      },
    }, 0)

    expect(migrated.progressByScenario.demo.consumedItemIds).toEqual([])
    expect(migrated.progressByScenario.demo.usedHotspotIds).toEqual([])
    expect(migrated.progressByScenario.demo.timerDeadlineAt).toBeNull()
    expect(migrated.progressByScenario.demo.pausedAt).toBeNull()
    expect(migrated.progressByScenario.demo.outcome).toBeNull()
  })

  it('démarre le minuteur une seule fois au début explicite de la partie', () => {
    useGameStore.getState().loadScenario(timedScenario, 'timed-demo')
    expect(useGameStore.getState().progressByScenario['timed-demo'].timerDeadlineAt).toBeNull()

    useGameStore.getState().startTimer(1_000)
    useGameStore.getState().startTimer(5_000)

    const progress = useGameStore.getState().progressByScenario['timed-demo']
    expect(progress.startedAt).toBe(1_000)
    expect(progress.timerDeadlineAt).toBe(61_000)
  })

  it('décale l’échéance de toute la durée d’une pause persistée', () => {
    useGameStore.getState().loadScenario(timedScenario, 'timed-demo')
    useGameStore.getState().startTimer(1_000)
    useGameStore.getState().pauseTimer(11_000)
    useGameStore.getState().unloadScenario()
    useGameStore.getState().loadScenario(timedScenario, 'timed-demo')

    expect(useGameStore.getState().progressByScenario['timed-demo'].pausedAt).toBe(11_000)
    useGameStore.getState().resumeTimer(31_000)

    const progress = useGameStore.getState().progressByScenario['timed-demo']
    expect(progress.pausedAt).toBeNull()
    expect(progress.timerDeadlineAt).toBe(81_000)
  })

  it('applique une pénalité à une mauvaise réponse sans pénaliser une bonne réponse', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    useGameStore.getState().loadScenario(timedScenario, 'timed-demo')
    useGameStore.getState().startTimer()

    const failure = useGameStore.getState().attemptPuzzle('enigme-chrono', 'non')
    expect(failure).toEqual({ success: false, penaltySeconds: 15, outcome: null })
    expect(useGameStore.getState().progressByScenario['timed-demo'].timerDeadlineAt).toBe(55_000)

    const success = useGameStore.getState().attemptPuzzle('enigme-chrono', 'oui')
    expect(success).toEqual({ success: true, penaltySeconds: 0, outcome: null })
    expect(useGameStore.getState().progressByScenario['timed-demo'].timerDeadlineAt).toBe(55_000)
  })

  it('fait perdre immédiatement si une pénalité consomme le temps restant', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    useGameStore.getState().loadScenario(timedScenario, 'timed-demo')
    useGameStore.getState().startTimer()
    vi.setSystemTime(56_000)

    const result = useGameStore.getState().attemptPuzzle('enigme-chrono', 'non')

    expect(result.outcome).toBe('lost')
    expect(useGameStore.getState().progressByScenario['timed-demo'].finishedAt).toBe(56_000)
  })

  it('fait perdre lorsque l’échéance exacte est atteinte', () => {
    useGameStore.getState().loadScenario(timedScenario, 'timed-demo')
    useGameStore.getState().startTimer(1_000)

    expect(useGameStore.getState().checkTimerExpired(60_999)).toBe(false)
    expect(useGameStore.getState().checkTimerExpired(61_000)).toBe(true)
    expect(useGameStore.getState().progressByScenario['timed-demo'].outcome).toBe('lost')
  })

  it('refuse les interactions pendant la pause', () => {
    useGameStore.getState().loadScenario(timedScenario, 'timed-demo')
    useGameStore.getState().startTimer(1_000)
    useGameStore.getState().pauseTimer(2_000)

    const result = useGameStore.getState().attemptPuzzle('enigme-chrono', 'oui')

    expect(result.success).toBe(false)
    expect(useGameStore.getState().progressByScenario['timed-demo'].attemptsByPuzzleId).toEqual({})
  })

  it('arrête le minuteur en entrant dans la scène finale', () => {
    vi.useFakeTimers()
    vi.setSystemTime(10_000)
    useGameStore.getState().loadScenario(timedScenario, 'timed-demo')
    useGameStore.getState().startTimer()
    vi.setSystemTime(20_000)

    useGameStore.getState().goToScene('scene-finale')

    const progress = useGameStore.getState().progressByScenario['timed-demo']
    expect(progress.outcome).toBe('won')
    expect(progress.finishedAt).toBe(20_000)
  })
})
