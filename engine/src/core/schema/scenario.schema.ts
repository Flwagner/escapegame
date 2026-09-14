import { z } from 'zod'
import { InventoryItemSchema } from './clue.schema'
import { SceneSchema } from './scene.schema'

export const ScenarioSchema = z.object({
  /** Version du format, pour permettre des migrations futures sans casser les scénarios existants */
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  author: z.string().optional(),
  /** Difficulté indicative affichée dans le sélecteur */
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  /** Miniature affichée sur l'écran de sélection, chemin relatif à assets/images/ */
  thumbnail: z.string().optional(),
  /** Chemin relatif au CSS custom du scénario (ex: "theme.css") */
  theme: z.string().optional(),
  introSceneId: z.string().min(1),
  items: z.array(InventoryItemSchema).default([]),
  scenes: z.array(SceneSchema).min(1),
})
export type Scenario = z.infer<typeof ScenarioSchema>

export const ManifestEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
  thumbnail: z.string().optional(),
  /** Dossier du scénario dans /scenarios (ex: "exemple-scenario-1") */
  path: z.string().min(1),
})
export type ManifestEntry = z.infer<typeof ManifestEntrySchema>

export const ManifestSchema = z.object({
  scenarios: z.array(ManifestEntrySchema),
})
export type Manifest = z.infer<typeof ManifestSchema>
