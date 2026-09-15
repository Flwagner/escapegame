import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '../../../types/scenario'
import { migratePersistedGameState, useGameStore } from '../gameStore'

const scenario: Scenario = {
  schemaVersion: 1,
  id: 'demo',
  title: 'Démo',
  introSceneId: 'scene-1',
  items: [],
  scenes: [
    { id: 'scene-1', title: 'Scène 1', hotspots: [], clues: [], puzzles: [] },
    { id: 'scene-2', title: 'Scène 2', hotspots: [], clues: [], puzzles: [] },
  ],
}

const inventoryScenario: Scenario = {
  schemaVersion: 1,
  id: 'inventory-demo',
  title: 'Inventaire',
  introSceneId: 'scene-1',
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

describe('gameStore', () => {
  beforeEach(() => {
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
  })
})
