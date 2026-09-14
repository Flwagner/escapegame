import { describe, expect, it } from 'vitest'
import { isImageAsset } from '../assetType'

describe('isImageAsset', () => {
  it('recognizes common image extensions', () => {
    expect(isImageAsset('assets/images/note.png')).toBe(true)
    expect(isImageAsset('assets/images/note.JPG')).toBe(true)
    expect(isImageAsset('assets/images/note.webp')).toBe(true)
  })

  it('ignores query strings when checking the extension', () => {
    expect(isImageAsset('assets/images/note.png?v=2')).toBe(true)
  })

  it('returns false for non-image assets like PDFs', () => {
    expect(isImageAsset('assets/documents/rapport.pdf')).toBe(false)
  })
})
