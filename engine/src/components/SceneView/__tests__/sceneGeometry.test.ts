import { describe, expect, it } from 'vitest'
import { getContainedSize, pointToPercent } from '../sceneGeometry'

describe('getContainedSize', () => {
  it('contains a landscape image in a desktop viewport', () => {
    expect(getContainedSize({ width: 1440, height: 788 }, { width: 1600, height: 900 })).toEqual({
      width: 1400.888888888889,
      height: 788,
    })
  })

  it('keeps the complete landscape image visible in portrait', () => {
    expect(getContainedSize({ width: 375, height: 700 }, { width: 1600, height: 900 })).toEqual({
      width: 375,
      height: 210.9375,
    })
  })

  it('returns an empty size while dimensions are unavailable', () => {
    expect(getContainedSize({ width: 375, height: 700 }, { width: 0, height: 0 })).toEqual({ width: 0, height: 0 })
  })
})

describe('pointToPercent', () => {
  it('projects stage pixels to stable percentages', () => {
    expect(pointToPercent({ x: 160, y: 450 }, { width: 1600, height: 900 })).toEqual({ x: 10, y: 50 })
  })

  it('clamps points to stage bounds', () => {
    expect(pointToPercent({ x: -20, y: 950 }, { width: 1600, height: 900 })).toEqual({ x: 0, y: 100 })
  })
})
