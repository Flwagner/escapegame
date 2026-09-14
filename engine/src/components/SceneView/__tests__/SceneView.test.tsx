import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { Scene } from '../../../types/scenario'
import { SceneView } from '../SceneView'

vi.mock('../../../core/state/gameStore', () => ({
  useGameStore: (selector: (state: { isHotspotUnlocked: () => boolean }) => unknown) =>
    selector({ isHotspotUnlocked: () => true }),
}))

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
})

const scene: Scene = {
  id: 'salon',
  title: 'Salon',
  background: 'assets/images/salon.webp',
  hotspots: [
    {
      id: 'table',
      x: 20,
      y: 60,
      width: 16,
      height: 18,
      label: 'Table',
      action: { kind: 'show-clue', clueId: 'note' },
    },
  ],
  clues: [{ id: 'note', type: 'text', title: 'Note', content: 'Texte' }],
  puzzles: [],
}

describe('SceneView', () => {
  it('renders the image and hotspot layer in the same transformed stage', () => {
    const { container } = render(<SceneView scene={scene} scenarioPath="test" onHotspotAction={() => {}} />)
    const image = container.querySelector('img:not([aria-hidden="true"])')
    const hotspot = screen.getByRole('button', { name: 'Table' })

    expect(image).not.toBeNull()
    expect(hotspot.parentElement?.parentElement).toBe(image?.parentElement)
    expect(hotspot.style.left).toBe('20%')
    expect(hotspot.style.top).toBe('60%')
    expect(hotspot.style.width).toBe('16%')
    expect(hotspot.style.height).toBe('18%')
  })

  it('dispatches the action from the calibrated hotspot', () => {
    const onHotspotAction = vi.fn()
    render(<SceneView scene={scene} scenarioPath="test" onHotspotAction={onHotspotAction} />)

    fireEvent.click(screen.getByRole('button', { name: 'Table' }))
    expect(onHotspotAction).toHaveBeenCalledWith(scene.hotspots[0])
  })
})
