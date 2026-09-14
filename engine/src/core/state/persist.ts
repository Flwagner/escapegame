import { useGameStore } from './gameStore'

/**
 * Petits helpers autour de la persistance localStorage, utilisés par l'UI
 * (ex: bouton "Recommencer" sur l'écran de sélection de scénario) sans avoir
 * à connaître le détail du store Zustand.
 */

export function clearScenarioSave(scenarioId: string): void {
  const state = useGameStore.getState()
  const { [scenarioId]: _removed, ...rest } = state.progressByScenario
  useGameStore.setState({ progressByScenario: rest })
}

export function hasSavedProgress(scenarioId: string): boolean {
  return Boolean(useGameStore.getState().progressByScenario[scenarioId])
}

export function clearAllSaves(): void {
  useGameStore.setState({ progressByScenario: {} })
}
