import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGameStore } from '../../../core/state/gameStore'
import { ScenarioSelector } from '../ScenarioSelector'

vi.mock('../../../core/loader/scenarioLoader', () => ({
  loadManifest: () => Promise.resolve({
    scenarios: [{ id: 'demo', path: 'demo', title: 'Enquête démo' }],
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

    fireEvent.click(await screen.findByRole('button', { name: 'Recommencer depuis le début' }))

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

    fireEvent.click(await screen.findByRole('button', { name: 'Recommencer depuis le début' }))

    expect(useGameStore.getState().progressByScenario.demo).toBeDefined()
  })
})
