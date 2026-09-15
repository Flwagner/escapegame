import { describe, expect, it } from 'vitest'
import { clampPan, clampScale, MAX_SCALE, MIN_SCALE } from '../sceneZoomMath'

describe('clampScale', () => {
  it('clamps below the minimum', () => {
    expect(clampScale(0.2)).toBe(MIN_SCALE)
  })

  it('clamps above the maximum', () => {
    expect(clampScale(10)).toBe(MAX_SCALE)
  })

  it('keeps values within range unchanged', () => {
    expect(clampScale(2)).toBe(2)
  })
})

describe('clampPan', () => {
  it('returns 0 when content is smaller than the container', () => {
    expect(clampPan(50, { containerSize: 400, contentSize: 200, scale: 1 })).toBe(0)
  })

  it('clamps positive overflow', () => {
    expect(clampPan(1000, { containerSize: 400, contentSize: 400, scale: 2 })).toBe(200)
  })

  it('clamps negative overflow', () => {
    expect(clampPan(-1000, { containerSize: 400, contentSize: 400, scale: 2 })).toBe(-200)
  })

  it('keeps in-range pan unchanged', () => {
    expect(clampPan(50, { containerSize: 400, contentSize: 400, scale: 2 })).toBe(50)
  })
})
