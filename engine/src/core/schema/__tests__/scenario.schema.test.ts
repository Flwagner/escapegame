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

  it('rejette un cadenas dont le nombre de roues ne correspond pas à la combinaison', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      scenes: [{
        id: 'scene-1',
        title: 'S1',
        puzzles: [{
          id: 'cadenas',
          type: 'combination-lock',
          prompt: 'Ouvrez le cadenas',
          wheels: 3,
          combination: [1, 2],
        }],
      }],
    })
    expect(result.success).toBe(false)
  })

  it('rejette une réponse à choix multiple qui référence une option inconnue', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      scenes: [{
        id: 'scene-1',
        title: 'S1',
        puzzles: [{
          id: 'choix',
          type: 'multiple-choice',
          prompt: 'Choisissez',
          options: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
          correctOptionIds: ['c'],
        }],
      }],
    })
    expect(result.success).toBe(false)
  })

  it('rejette une séquence qui ne contient pas chaque élément une fois', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      scenes: [{
        id: 'scene-1',
        title: 'S1',
        puzzles: [{
          id: 'sequence',
          type: 'sequence',
          prompt: 'Ordonnez',
          items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
          correctOrder: ['a', 'a'],
        }],
      }],
    })
    expect(result.success).toBe(false)
  })

  it('accepte un hotspot qui utilise un objet déclaré', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      items: [{ id: 'cle', name: 'Clé' }],
      scenes: [{
        id: 'scene-1',
        title: 'S1',
        hotspots: [{
          id: 'porte',
          x: 10,
          y: 10,
          width: 20,
          height: 20,
          action: { kind: 'go-to-scene', sceneId: 'scene-1' },
          useItemId: 'cle',
        }],
      }],
    })

    expect(result.success).toBe(true)
  })

  it('rejette un hotspot qui utilise un objet inconnu', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      scenes: [{
        id: 'scene-1',
        title: 'S1',
        hotspots: [{
          id: 'porte',
          x: 10,
          y: 10,
          width: 20,
          height: 20,
          action: { kind: 'go-to-scene', sceneId: 'scene-1' },
          useItemId: 'cle-inconnue',
        }],
      }],
    })

    expect(result.success).toBe(false)
  })

  it('rejette plusieurs hotspots qui consomment le même objet', () => {
    const hotspot = {
      x: 10,
      y: 10,
      width: 20,
      height: 20,
      action: { kind: 'go-to-scene', sceneId: 'scene-1' },
      useItemId: 'cle',
    }
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      items: [{ id: 'cle', name: 'Clé' }],
      scenes: [{
        id: 'scene-1',
        title: 'S1',
        hotspots: [
          { ...hotspot, id: 'porte-1' },
          { ...hotspot, id: 'porte-2' },
        ],
      }],
    })

    expect(result.success).toBe(false)
  })

  it('rejette les identifiants dupliqués parmi les hotspots utilisant un objet', () => {
    const result = ScenarioSchema.safeParse({
      schemaVersion: 1,
      id: 'demo',
      title: 'Démo',
      introSceneId: 'scene-1',
      items: [{ id: 'cle-1', name: 'Clé 1' }, { id: 'cle-2', name: 'Clé 2' }],
      scenes: [{
        id: 'scene-1',
        title: 'S1',
        hotspots: [
          {
            id: 'porte', x: 0, y: 0, width: 10, height: 10,
            action: { kind: 'go-to-scene', sceneId: 'scene-1' }, useItemId: 'cle-1',
          },
          {
            id: 'porte', x: 20, y: 20, width: 10, height: 10,
            action: { kind: 'go-to-scene', sceneId: 'scene-1' }, useItemId: 'cle-2',
          },
        ],
      }],
    })

    expect(result.success).toBe(false)
  })
})
