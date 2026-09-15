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
  const progress = useGameStore.getState().progressByScenario[scenarioId]
  if (!progress) return false

  return progress.timerDeadlineAt !== null
    || progress.finishedAt !== null
    || progress.outcome !== null
    || progress.solvedPuzzleIds.length > 0
    || progress.collectedItemIds.length > 0
    || progress.consumedItemIds.length > 0
    || progress.usedHotspotIds.length > 0
    || progress.unlockedClueIds.length > 0
    || Object.keys(progress.attemptsByPuzzleId).length > 0
}

export function clearAllSaves(): void {
  useGameStore.setState({ progressByScenario: {} })
}
