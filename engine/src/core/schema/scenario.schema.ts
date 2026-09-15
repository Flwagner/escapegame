import { z } from 'zod'
import { InventoryItemSchema } from './clue.schema'
import { SceneSchema } from './scene.schema'

export const ScenarioSchema = z
  .object({
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
  .superRefine((scenario, ctx) => {
    const itemIds = new Set(scenario.items.map((item) => item.id))
    const usedItemIds = new Set<string>()
    const itemUseHotspotIds = new Set<string>()
    scenario.scenes.forEach((scene, sceneIndex) => {
      scene.hotspots.forEach((hotspot, hotspotIndex) => {
        if (!hotspot.useItemId) return
        const path = ['scenes', sceneIndex, 'hotspots', hotspotIndex, 'useItemId']
        if (!itemIds.has(hotspot.useItemId)) {
          ctx.addIssue({
            code: 'custom',
            message: `L'objet "${hotspot.useItemId}" utilisé par le hotspot n'est pas déclaré.`,
            path,
          })
        }
        if (usedItemIds.has(hotspot.useItemId)) {
          ctx.addIssue({
            code: 'custom',
            message: `L'objet consommable "${hotspot.useItemId}" ne peut être utilisé que par un hotspot.`,
            path,
          })
        }
        if (itemUseHotspotIds.has(hotspot.id)) {
          ctx.addIssue({
            code: 'custom',
            message: `L'identifiant de hotspot "${hotspot.id}" doit être unique parmi les hotspots utilisant un objet.`,
            path: ['scenes', sceneIndex, 'hotspots', hotspotIndex, 'id'],
          })
        }
        usedItemIds.add(hotspot.useItemId)
        itemUseHotspotIds.add(hotspot.id)
      })
    })
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
