import { describe, expect, it } from 'vitest'
import { shuffleSequenceItems } from '../shuffleSequenceItems'

const items = [
  { id: 'first', label: 'Premier' },
  { id: 'second', label: 'Deuxième' },
  { id: 'third', label: 'Troisième' },
]
const correctOrder = items.map((item) => item.id)

describe('shuffleSequenceItems', () => {
  it('mélange les éléments sans les modifier', () => {
    const shuffled = shuffleSequenceItems(items, correctOrder, () => 0)

    expect(shuffled.map((item) => item.id)).toEqual(['second', 'third', 'first'])
    expect(shuffled).toEqual(expect.arrayContaining(items))
    expect(items.map((item) => item.id)).toEqual(correctOrder)
  })

  it('empêche que les éléments soient affichés dans le bon ordre', () => {
    const shuffled = shuffleSequenceItems(items, correctOrder, () => 0.999)

    expect(shuffled.map((item) => item.id)).toEqual(['second', 'first', 'third'])
  })
})
