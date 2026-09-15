import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Scenario } from '../../types/scenario'
import { canExitScene, findScene, isClueVisible, isHotspotVisible } from '../engine/sceneEngine'
import { checkPuzzleAnswer } from '../engine/puzzleEngine'

export interface ScenarioProgress {
  currentSceneId: string
  solvedPuzzleIds: string[]
  /** Historique des objets trouvés, y compris ceux qui ont ensuite été utilisés. */
  collectedItemIds: string[]
  consumedItemIds: string[]
  usedHotspotIds: string[]
  unlockedClueIds: string[]
  attemptsByPuzzleId: Record<string, number>
  startedAt: number
  finishedAt: number | null
}

function createEmptyProgress(introSceneId: string): ScenarioProgress {
  return {
    currentSceneId: introSceneId,
    solvedPuzzleIds: [],
    collectedItemIds: [],
    consumedItemIds: [],
    usedHotspotIds: [],
    unlockedClueIds: [],
    attemptsByPuzzleId: {},
    startedAt: Date.now(),
    finishedAt: null,
  }
}

export interface GameState {
  scenario: Scenario | null
  scenarioPath: string | null
  /** Sauvegardes indexées par id de scénario : chaque scénario a sa propre progression persistée. */
  progressByScenario: Record<string, ScenarioProgress>

  loadScenario: (scenario: Scenario, scenarioPath: string) => void
  resetProgress: () => void
  unloadScenario: () => void

  goToScene: (sceneId: string) => void
  attemptPuzzle: (puzzleId: string, answer: unknown) => { success: boolean }
  collectItem: (itemId: string) => boolean
  activateHotspotWithItem: (hotspotId: string, itemId: string) => boolean
  revealClue: (clueId: string) => void

  isSceneExitAllowed: () => boolean
  isHotspotUnlocked: (hotspotId: string) => boolean
  isClueUnlocked: (clueId: string) => boolean
  getCurrentProgress: () => ScenarioProgress | null
}

type PersistedScenarioProgress = Omit<ScenarioProgress, 'consumedItemIds' | 'usedHotspotIds'> & {
  consumedItemIds?: string[]
  usedHotspotIds?: string[]
}

interface PersistedGameState {
  scenarioPath: string | null
  progressByScenario: Record<string, PersistedScenarioProgress>
}

export function migratePersistedGameState(state: unknown, version: number): PersistedGameState {
  const persisted = state as PersistedGameState
  if (version >= 1) return persisted
  return {
    ...persisted,
    progressByScenario: Object.fromEntries(
      Object.entries(persisted.progressByScenario ?? {}).map(([scenarioId, progress]) => [
        scenarioId,
        {
          ...progress,
          consumedItemIds: progress.consumedItemIds ?? [],
          usedHotspotIds: progress.usedHotspotIds ?? [],
        },
      ]),
    ),
  }
}

function updateCurrentProgress(
  state: GameState,
  updater: (progress: ScenarioProgress) => ScenarioProgress,
): Partial<GameState> {
  if (!state.scenario) return {}
  const scenarioId = state.scenario.id
  const current = state.progressByScenario[scenarioId]
  if (!current) return {}
  return {
    progressByScenario: {
      ...state.progressByScenario,
      [scenarioId]: updater(current),
    },
  }
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      scenario: null,
      scenarioPath: null,
      progressByScenario: {},

      loadScenario: (scenario, scenarioPath) => {
        set((state) => {
          const existing = state.progressByScenario[scenario.id]
          const sceneIds = new Set(scenario.scenes.map((scene) => scene.id))
          const puzzleIds = new Set(scenario.scenes.flatMap((scene) => scene.puzzles.map((puzzle) => puzzle.id)))
          const clueIds = new Set(scenario.scenes.flatMap((scene) => scene.clues.map((clue) => clue.id)))
          const itemIds = new Set(scenario.items.map((item) => item.id))
          const hotspotIds = new Set(scenario.scenes.flatMap((scene) => scene.hotspots.map((hotspot) => hotspot.id)))
          const progress = existing
            ? (() => {
                const consumedItemIds = [...new Set((existing.consumedItemIds ?? []).filter((id) => itemIds.has(id)))]
                return {
                  ...existing,
                  currentSceneId: sceneIds.has(existing.currentSceneId) ? existing.currentSceneId : scenario.introSceneId,
                  solvedPuzzleIds: existing.solvedPuzzleIds.filter((id) => puzzleIds.has(id)),
                  collectedItemIds: [
                    ...new Set([
                      ...existing.collectedItemIds.filter((id) => itemIds.has(id)),
                      ...consumedItemIds,
                    ]),
                  ],
                  consumedItemIds,
                  usedHotspotIds: [
                    ...new Set((existing.usedHotspotIds ?? []).filter((id) => hotspotIds.has(id))),
                  ],
                  unlockedClueIds: existing.unlockedClueIds.filter((id) => clueIds.has(id)),
                  attemptsByPuzzleId: Object.fromEntries(
                    Object.entries(existing.attemptsByPuzzleId).filter(([id]) => puzzleIds.has(id)),
                  ),
                }
              })()
            : createEmptyProgress(scenario.introSceneId)
          return {
            scenario,
            scenarioPath,
            progressByScenario: {
              ...state.progressByScenario,
              [scenario.id]: progress,
            },
          }
        })
      },

      unloadScenario: () => set({ scenario: null, scenarioPath: null }),

      resetProgress: () => {
        const scenario = get().scenario
        if (!scenario) return
        set((state) => ({
          progressByScenario: {
            ...state.progressByScenario,
            [scenario.id]: createEmptyProgress(scenario.introSceneId),
          },
        }))
      },

      goToScene: (sceneId) =>
        set((state) => {
          if (!state.scenario || !findScene(state.scenario.scenes, sceneId)) return {}
          return updateCurrentProgress(state, (p) => ({ ...p, currentSceneId: sceneId }))
        }),

      attemptPuzzle: (puzzleId, answer) => {
        const state = get()
        const progress = state.getCurrentProgress()
        const scene =
          state.scenario && progress ? findScene(state.scenario.scenes, progress.currentSceneId) : undefined
        const puzzle = scene?.puzzles.find((p) => p.id === puzzleId)
        if (!puzzle || !progress) return { success: false }

        const alreadySolved = progress.solvedPuzzleIds.includes(puzzleId)
        if (alreadySolved) return { success: true }
        const result = checkPuzzleAnswer(puzzle, answer)

        set((s) =>
          updateCurrentProgress(s, (p) => {
            const attempts = { ...p.attemptsByPuzzleId, [puzzleId]: (p.attemptsByPuzzleId[puzzleId] ?? 0) + 1 }
            if (!result.success) {
              return { ...p, attemptsByPuzzleId: attempts }
            }
            const rewards = puzzle.rewards
            return {
              ...p,
              attemptsByPuzzleId: attempts,
              solvedPuzzleIds: [...p.solvedPuzzleIds, puzzleId],
              unlockedClueIds: [...new Set([...p.unlockedClueIds, ...(rewards?.unlockClues ?? [])])],
              collectedItemIds: [
                ...new Set([
                  ...p.collectedItemIds,
                  ...(rewards?.unlockItems ?? []).filter((id) => !p.consumedItemIds.includes(id)),
                ]),
              ],
            }
          }),
        )
        return { success: result.success }
      },

      collectItem: (itemId) => {
        const state = get()
        const progress = state.getCurrentProgress()
        if (
          !state.scenario?.items.some((item) => item.id === itemId) ||
          !progress ||
          progress.collectedItemIds.includes(itemId) ||
          progress.consumedItemIds.includes(itemId)
        ) {
          return false
        }
        set((currentState) =>
          updateCurrentProgress(currentState, (p) => ({
            ...p,
            collectedItemIds: [...p.collectedItemIds, itemId],
          })),
        )
        return true
      },

      activateHotspotWithItem: (hotspotId, itemId) => {
        const state = get()
        const progress = state.getCurrentProgress()
        const scene =
          state.scenario && progress ? findScene(state.scenario.scenes, progress.currentSceneId) : undefined
        const hotspot = scene?.hotspots.find((candidate) => candidate.id === hotspotId)
        if (
          !progress ||
          !hotspot ||
          hotspot.useItemId !== itemId ||
          progress.usedHotspotIds.includes(hotspotId) ||
          !progress.collectedItemIds.includes(itemId) ||
          progress.consumedItemIds.includes(itemId)
        ) {
          return false
        }
        set((currentState) =>
          updateCurrentProgress(currentState, (p) => ({
            ...p,
            consumedItemIds: [...p.consumedItemIds, itemId],
            usedHotspotIds: [...p.usedHotspotIds, hotspotId],
          })),
        )
        return true
      },

      revealClue: (clueId) =>
        set((state) =>
          updateCurrentProgress(state, (p) => ({
            ...p,
            unlockedClueIds: [...new Set([...p.unlockedClueIds, clueId])],
          })),
        ),

      getCurrentProgress: () => {
        const state = get()
        if (!state.scenario) return null
        return state.progressByScenario[state.scenario.id] ?? null
      },

      isSceneExitAllowed: () => {
        const state = get()
        const progress = state.getCurrentProgress()
        const scene =
          state.scenario && progress ? findScene(state.scenario.scenes, progress.currentSceneId) : undefined
        if (!scene || !progress) return false
        return canExitScene(scene, {
          solvedPuzzleIds: new Set(progress.solvedPuzzleIds),
          collectedItemIds: new Set(progress.collectedItemIds),
          unlockedClueIds: new Set(progress.unlockedClueIds),
        })
      },

      isHotspotUnlocked: (hotspotId) => {
        const state = get()
        const progress = state.getCurrentProgress()
        const scene =
          state.scenario && progress ? findScene(state.scenario.scenes, progress.currentSceneId) : undefined
        const hotspot = scene?.hotspots.find((h) => h.id === hotspotId)
        if (!hotspot || !progress) return false
        return isHotspotVisible(hotspot, {
          solvedPuzzleIds: new Set(progress.solvedPuzzleIds),
          collectedItemIds: new Set(progress.collectedItemIds),
          unlockedClueIds: new Set(progress.unlockedClueIds),
        })
      },

      isClueUnlocked: (clueId) => {
        const state = get()
        const progress = state.getCurrentProgress()
        const scene =
          state.scenario && progress ? findScene(state.scenario.scenes, progress.currentSceneId) : undefined
        const clue = scene?.clues.find((c) => c.id === clueId)
        if (!progress) return false
        if (!clue) return progress.unlockedClueIds.includes(clueId)
        return isClueVisible(clue, {
          solvedPuzzleIds: new Set(progress.solvedPuzzleIds),
          collectedItemIds: new Set(progress.collectedItemIds),
          unlockedClueIds: new Set(progress.unlockedClueIds),
        })
      },
    }),
    {
      name: 'escapegame-save',
      version: 1,
      migrate: migratePersistedGameState,
      storage: createJSONStorage(() => localStorage),
      // Le scénario complet (JSON) n'est pas persisté : seule la progression
      // l'est. Au retour sur le site, le scénario est rechargé depuis
      // /scenarios/<path>/scenario.json et la progression est restaurée
      // via progressByScenario[scenario.id].
      partialize: (state) => ({
        scenarioPath: state.scenarioPath,
        progressByScenario: state.progressByScenario,
      }),
    },
  ),
)
