import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../core/state/gameStore'
import { ScenarioSelector } from '../ScenarioSelector'

vi.mock('../../../core/loader/scenarioLoader', () => ({
  loadManifest: () => Promise.resolve({
    scenarios: [
      {
        id: 'demo',
        path: 'demo',
        title: 'Enquête démo',
        difficulty: 'medium',
        atmosphere: 'Mystère gothique',
        estimatedDurationMinutes: 20,
      },
    ],
  }),
}))

describe('ScenarioSelector', () => {
  beforeEach(() => {
    localStorage.clear()
    useGameStore.setState({
      scenario: null,
      scenarioPath: null,
      progressByScenario: {
        demo: {
          currentSceneId: 'scene-2',
          solvedPuzzleIds: ['enigme'],
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
  })

  it('permet de recommencer un scénario sauvegardé depuis le début', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<ScenarioSelector />} />
          <Route path="/play/:scenarioId" element={<p>Nouvelle partie</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Recommencer' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(useGameStore.getState().progressByScenario.demo).toBeUndefined()
    await waitFor(() => expect(screen.getByText('Nouvelle partie')).toBeTruthy())
  })

  it('conserve la sauvegarde si le recommencement est annulé', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(
      <MemoryRouter>
        <ScenarioSelector />
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Recommencer' }))

    expect(useGameStore.getState().progressByScenario.demo).toBeDefined()
  })

  it('présente la difficulté en étoiles et libelle l’ambiance', async () => {
    render(
      <MemoryRouter>
        <ScenarioSelector />
      </MemoryRouter>,
    )

    expect(await screen.findByLabelText('Moyenne, 2 étoiles sur 3')).toBeTruthy()
    expect(screen.getByText('Difficulté :')).toBeTruthy()
    expect(screen.getByText('Ambiance :')).toBeTruthy()
    expect(screen.getByText('Mystère gothique')).toBeTruthy()
    expect(screen.getByText('Durée :')).toBeTruthy()
    expect(screen.getByText('20 min')).toBeTruthy()
  })

  it('affiche les actions de reprise et de recommencement ensemble', async () => {
    render(
      <MemoryRouter>
        <ScenarioSelector />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('button', { name: 'Reprendre' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Recommencer' })).toBeTruthy()
  })

  it('ne considère pas une partie ouverte mais jamais commencée comme sauvegardée', async () => {
    useGameStore.setState({
      progressByScenario: {
        demo: {
          currentSceneId: 'scene-1',
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

    render(
      <MemoryRouter>
        <ScenarioSelector />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('button', { name: 'Commencer : Enquête démo' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Reprendre' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Recommencer' })).toBeNull()
  })
})
