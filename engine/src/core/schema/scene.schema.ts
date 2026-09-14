import { z } from 'zod'
import { ClueSchema } from './clue.schema'
import { PuzzleSchema } from './puzzle.schema'

/**
 * Une zone interactive sur une scène (image de fond cliquable/tactile).
 * Coordonnées exprimées en pourcentage (0-100) de la scène pour rester
 * responsive sur tous les écrans (mobile/tablette/desktop).
 */
export const HotspotSchema = z.object({
  id: z.string().min(1),
  /** Position et taille en % de la scène : x, y = coin haut-gauche */
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(0).max(100),
  height: z.number().min(0).max(100),
  label: z.string().optional(),
  /** Action déclenchée au clic/tap */
  action: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('open-puzzle'), puzzleId: z.string() }),
    z.object({ kind: z.literal('show-clue'), clueId: z.string() }),
    z.object({ kind: z.literal('go-to-scene'), sceneId: z.string() }),
    z.object({ kind: z.literal('collect-item'), itemId: z.string() }),
  ]),
  /** Condition d'affichage : nécessite un item ou un puzzle résolu avant d'apparaître */
  requiresItemIds: z.array(z.string()).optional(),
  requiresSolvedPuzzleIds: z.array(z.string()).optional(),
})
export type Hotspot = z.infer<typeof HotspotSchema>

export const SceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  /** Texte narratif affiché en arrivant sur la scène */
  narrative: z.string().optional(),
  /** Image de fond, chemin relatif à assets/images/ */
  background: z.string().optional(),
  /** Musique d'ambiance en boucle, chemin relatif à assets/audio/ */
  ambientSound: z.string().optional(),
  hotspots: z.array(HotspotSchema).default([]),
  clues: z.array(ClueSchema).default([]),
  puzzles: z.array(PuzzleSchema).default([]),
  /** Scènes accessibles seulement après résolution de puzzles de cette scène */
  exitConditions: z
    .object({
      requiresSolvedPuzzleIds: z.array(z.string()).optional(),
      nextSceneId: z.string().optional(),
    })
    .optional(),
})
export type Scene = z.infer<typeof SceneSchema>
