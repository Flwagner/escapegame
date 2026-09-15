import { describe, expect, it } from 'vitest'
import { formatRemainingTime, getRemainingSeconds } from '../timerUtils'

describe('GameTimer', () => {
  it('formate le temps restant en minutes et secondes', () => {
    expect(formatRemainingTime(600)).toBe('10:00')
    expect(formatRemainingTime(59)).toBe('00:59')
    expect(formatRemainingTime(0)).toBe('00:00')
  })

  it('arrondit la fraction de seconde restante vers le haut et borne à zéro', () => {
    expect(getRemainingSeconds(10_001, 10_000)).toBe(1)
    expect(getRemainingSeconds(10_000, 10_000)).toBe(0)
    expect(getRemainingSeconds(9_000, 10_000)).toBe(0)
  })
})
