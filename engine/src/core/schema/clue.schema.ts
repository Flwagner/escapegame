import { z } from 'zod'

/**
 * Un indice peut être du texte simple, une image, un document (PDF/scan) ou un son.
 * `unlockedBy` : conditions optionnelles avant que l'indice ne soit visible.
 * Si `unlockedBy` est absent, l'indice est visible dès l'entrée dans la scène.
 */
export const ClueTypeSchema = z.enum(['text', 'image', 'audio', 'document'])
export type ClueType = z.infer<typeof ClueTypeSchema>

export const ClueSchema = z.object({
  id: z.string().min(1),
  type: ClueTypeSchema,
  title: z.string().min(1),
  /** Texte de l'indice, ou chemin relatif vers l'asset (assets/images/xxx.jpg, etc.) selon le type */
  content: z.string().min(1),
  /** Texte alternatif pour l'accessibilité (images/documents) */
  alt: z.string().optional(),
  unlockedByPuzzleIds: z.array(z.string()).optional(),
  unlockedByItemIds: z.array(z.string()).optional(),
})
export type Clue = z.infer<typeof ClueSchema>

export const InventoryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  /** Chemin relatif vers une image d'illustration de l'objet (assets/images/xxx.png) */
  icon: z.string().optional(),
})
export type InventoryItem = z.infer<typeof InventoryItemSchema>
