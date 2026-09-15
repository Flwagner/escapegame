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
  timerDeadlineAt: number | null
  pausedAt: number | null
  outcome: GameOutcome
}

export type GameOutcome = 'won' | 'lost' | null

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
    timerDeadlineAt: null,
    pausedAt: null,
    outcome: null,
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

  startTimer: (now?: number) => void
  pauseTimer: (now?: number) => void
  resumeTimer: (now?: number) => void
  checkTimerExpired: (now?: number) => boolean

  goToScene: (sceneId: string) => void
  attemptPuzzle: (puzzleId: string, answer: unknown) => {
    success: boolean
    penaltySeconds: number
    outcome: GameOutcome
  }
  collectItem: (itemId: string) => boolean
  activateHotspotWithItem: (hotspotId: string, itemId: string) => boolean
  revealClue: (clueId: string) => void

  isSceneExitAllowed: () => boolean
  isHotspotUnlocked: (hotspotId: string) => boolean
  isClueUnlocked: (clueId: string) => boolean
  getCurrentProgress: () => ScenarioProgress | null
}

type PersistedScenarioProgress = Omit<
  ScenarioProgress,
  'consumedItemIds' | 'usedHotspotIds' | 'timerDeadlineAt' | 'pausedAt' | 'outcome'
> & {
  consumedItemIds?: string[]
  usedHotspotIds?: string[]
  timerDeadlineAt?: number | null
  pausedAt?: number | null
  outcome?: GameOutcome
}

interface PersistedGameState {
  scenarioPath: string | null
  progressByScenario: Record<string, PersistedScenarioProgress>
}

export function migratePersistedGameState(state: unknown, _version: number): PersistedGameState {
  const persisted = state as PersistedGameState
  return {
    ...persisted,
    progressByScenario: Object.fromEntries(
      Object.entries(persisted.progressByScenario ?? {}).map(([scenarioId, progress]) => [
        scenarioId,
        {
          ...progress,
          consumedItemIds: progress.consumedItemIds ?? [],
          usedHotspotIds: progress.usedHotspotIds ?? [],
          timerDeadlineAt: progress.timerDeadlineAt ?? null,
          pausedAt: progress.pausedAt ?? null,
          outcome: progress.outcome ?? null,
        },
      ]),
    ),
  }
}

function isInteractionBlocked(progress: ScenarioProgress): boolean {
  return progress.pausedAt !== null || progress.outcome !== null
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
                  timerDeadlineAt: existing.timerDeadlineAt ?? null,
                  pausedAt: existing.pausedAt ?? null,
                  outcome: existing.outcome ?? null,
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

      startTimer: (now = Date.now()) =>
        set((state) => {
          if (!state.scenario?.timer) return {}
          return updateCurrentProgress(state, (progress) => {
            if (progress.timerDeadlineAt !== null || progress.outcome !== null) return progress
            return {
              ...progress,
              startedAt: now,
              timerDeadlineAt: now + state.scenario!.timer!.durationSeconds * 1000,
            }
          })
        }),

      pauseTimer: (now = Date.now()) => {
        const state = get()
        const progress = state.getCurrentProgress()
        if (!state.scenario?.timer || !progress || progress.timerDeadlineAt === null || isInteractionBlocked(progress)) return
        if (state.checkTimerExpired(now)) return
        set((currentState) =>
          updateCurrentProgress(currentState, (currentProgress) => ({ ...currentProgress, pausedAt: now })),
        )
      },

      resumeTimer: (now = Date.now()) =>
        set((state) =>
          updateCurrentProgress(state, (progress) => {
            if (progress.pausedAt === null || progress.timerDeadlineAt === null || progress.outcome !== null) {
              return progress
            }
            return {
              ...progress,
              timerDeadlineAt: progress.timerDeadlineAt + Math.max(0, now - progress.pausedAt),
              pausedAt: null,
            }
          }),
        ),

      checkTimerExpired: (now = Date.now()) => {
        const state = get()
        const progress = state.getCurrentProgress()
        if (
          !state.scenario?.timer ||
          !progress ||
          progress.timerDeadlineAt === null ||
          progress.pausedAt !== null ||
          progress.outcome !== null ||
          progress.timerDeadlineAt > now
        ) {
          return progress?.outcome === 'lost'
        }
        set((currentState) =>
          updateCurrentProgress(currentState, (currentProgress) => ({
            ...currentProgress,
            outcome: 'lost',
            finishedAt: now,
          })),
        )
        return true
      },

      goToScene: (sceneId) => {
        const now = Date.now()
        if (get().checkTimerExpired(now)) return
        set((state) => {
          const progress = state.getCurrentProgress()
          if (!state.scenario || !progress || isInteractionBlocked(progress) || !findScene(state.scenario.scenes, sceneId)) {
            return {}
          }
          const won = state.scenario.timer?.victorySceneId === sceneId
          return updateCurrentProgress(state, (currentProgress) => ({
            ...currentProgress,
            currentSceneId: sceneId,
            outcome: won ? 'won' : currentProgress.outcome,
            finishedAt: won ? now : currentProgress.finishedAt,
          }))
        })
      },

      attemptPuzzle: (puzzleId, answer) => {
        const now = Date.now()
        if (get().checkTimerExpired(now)) return { success: false, penaltySeconds: 0, outcome: 'lost' }
        const state = get()
        const progress = state.getCurrentProgress()
        const scene =
          state.scenario && progress ? findScene(state.scenario.scenes, progress.currentSceneId) : undefined
        const puzzle = scene?.puzzles.find((p) => p.id === puzzleId)
        if (!puzzle || !progress || isInteractionBlocked(progress)) {
          return { success: false, penaltySeconds: 0, outcome: progress?.outcome ?? null }
        }

        const alreadySolved = progress.solvedPuzzleIds.includes(puzzleId)
        if (alreadySolved) return { success: true, penaltySeconds: 0, outcome: progress.outcome }
        const result = checkPuzzleAnswer(puzzle, answer)
        const penaltySeconds = result.success || progress.timerDeadlineAt === null
          ? 0
          : (puzzle.failurePenaltySeconds ?? 0)
        let outcome: GameOutcome = progress.outcome

        set((s) =>
          updateCurrentProgress(s, (p) => {
            const attempts = { ...p.attemptsByPuzzleId, [puzzleId]: (p.attemptsByPuzzleId[puzzleId] ?? 0) + 1 }
            if (!result.success) {
              const timerDeadlineAt = p.timerDeadlineAt === null
                ? null
                : p.timerDeadlineAt - penaltySeconds * 1000
              const lost = timerDeadlineAt !== null && timerDeadlineAt <= now
              outcome = lost ? 'lost' : p.outcome
              return {
                ...p,
                attemptsByPuzzleId: attempts,
                timerDeadlineAt,
                outcome,
                finishedAt: lost ? now : p.finishedAt,
              }
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
        return { success: result.success, penaltySeconds, outcome }
      },

      collectItem: (itemId) => {
        if (get().checkTimerExpired()) return false
        const state = get()
        const progress = state.getCurrentProgress()
        if (
          !state.scenario?.items.some((item) => item.id === itemId) ||
          !progress ||
          isInteractionBlocked(progress) ||
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
        if (get().checkTimerExpired()) return false
        const state = get()
        const progress = state.getCurrentProgress()
        const scene =
          state.scenario && progress ? findScene(state.scenario.scenes, progress.currentSceneId) : undefined
        const hotspot = scene?.hotspots.find((candidate) => candidate.id === hotspotId)
        if (
          !progress ||
          isInteractionBlocked(progress) ||
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

      revealClue: (clueId) => {
        if (get().checkTimerExpired()) return
        set((state) =>
          updateCurrentProgress(state, (p) => ({
            ...p,
            unlockedClueIds: isInteractionBlocked(p)
              ? p.unlockedClueIds
              : [...new Set([...p.unlockedClueIds, clueId])],
          })),
        )
      },

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
      version: 2,
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
