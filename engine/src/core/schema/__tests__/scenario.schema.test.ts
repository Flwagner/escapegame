import { describe, expect, it } from 'vitest'
import { ScenarioSchema } from '../scenario.schema'

describe('ScenarioSchema', () => {
  it('valide un scénario minimal correct', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      scenes: [
        {
          id: 'scene-1',
          title: 'Scène 1',
          hotspots: [],
          clues: [],
          puzzles: [],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejette un scénario sans scène', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      scenes: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejette un mauvais schemaVersion', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 2,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      scenes: [{ id: 'scene-1', title: 'S1', hotspots: [], clues: [], puzzles: [] }],
    })
    expect(result.success).toBe(false)
  })
})
