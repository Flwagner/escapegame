import { beforeEach, describe, expect, it } from 'vitest'
import type { Scenario } from '../../../types/scenario'
import { useGameStore } from '../gameStore'

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
})
