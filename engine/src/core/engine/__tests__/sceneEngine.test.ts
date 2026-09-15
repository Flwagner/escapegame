import { describe, expect, it } from 'vitest'
import type { Hotspot } from '../../../types/scenario'
import { isClueVisible, isHotspotVisible } from '../sceneEngine'

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

describe('isHotspotVisible', () => {
  const collectHotspot: Hotspot = {
    id: 'prendre-cle',
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    action: { kind: 'collect-item', itemId: 'cle' },
  }

  it('affiche un objet qui n’a jamais été collecté', () => {
    expect(isHotspotVisible(collectHotspot, emptyState)).toBe(true)
  })

  it('masque définitivement le hotspot après la collecte', () => {
    expect(
      isHotspotVisible(collectHotspot, { ...emptyState, collectedItemIds: new Set(['cle']) }),
    ).toBe(false)
  })
})
