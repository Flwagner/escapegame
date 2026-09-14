import type { Hotspot, Scene } from '../../types/scenario'

export interface UnlockState {
  solvedPuzzleIds: Set<string>
  collectedItemIds: Set<string>
  unlockedClueIds: Set<string>
}

/** Un hotspot est visible si toutes ses conditions de déblocage sont remplies. */
export function isHotspotVisible(hotspot: Hotspot, state: UnlockState): boolean {
  const requiresItems = hotspot.requiresItemIds ?? []
  const requiresPuzzles = hotspot.requiresSolvedPuzzleIds ?? []
  return (
    requiresItems.every((id) => state.collectedItemIds.has(id)) &&
    requiresPuzzles.every((id) => state.solvedPuzzleIds.has(id))
  )
}

/** Un indice est visible s'il n'a pas de condition, ou si ses conditions sont remplies. */
export function isClueVisible(
  clue: { unlockedByPuzzleIds?: string[]; unlockedByItemIds?: string[] },
  state: UnlockState,
): boolean {
  const requiresPuzzles = clue.unlockedByPuzzleIds ?? []
  const requiresItems = clue.unlockedByItemIds ?? []
  if (requiresPuzzles.length === 0 && requiresItems.length === 0) return true
  return (
    requiresPuzzles.every((id) => state.solvedPuzzleIds.has(id)) &&
    requiresItems.every((id) => state.collectedItemIds.has(id))
  )
}

/** Détermine si la sortie de la scène courante est autorisée (tous les puzzles requis résolus). */
export function canExitScene(scene: Scene, state: UnlockState): boolean {
  const required = scene.exitConditions?.requiresSolvedPuzzleIds ?? []
  return required.every((id) => state.solvedPuzzleIds.has(id))
}

export function findScene(scenes: Scene[], sceneId: string): Scene | undefined {
  return scenes.find((s) => s.id === sceneId)
}
