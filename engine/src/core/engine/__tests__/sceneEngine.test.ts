import { describe, expect, it } from 'vitest'
import { isClueVisible } from '../sceneEngine'

const emptyState = {
  solvedPuzzleIds: new Set<string>(),
  collectedItemIds: new Set<string>(),
  unlockedClueIds: new Set<string>(),
}

describe('isClueVisible', () => {
  it('masque un indice dont les conditions ne sont pas remplies', () => {
    expect(
      isClueVisible({ id: 'indice', unlockedByPuzzleIds: ['enigme'] }, emptyState),
    ).toBe(false)
  })

  it('affiche un indice explicitement débloqué par une récompense', () => {
    expect(
      isClueVisible(
        { id: 'indice', unlockedByPuzzleIds: ['enigme'] },
        { ...emptyState, unlockedClueIds: new Set(['indice']) },
      ),
    ).toBe(true)
  })
})
