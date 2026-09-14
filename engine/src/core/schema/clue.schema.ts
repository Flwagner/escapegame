import { z } from 'zod'

/**
 * Un indice peut être du texte simple, une image, un document (PDF/scan) ou un son.
 * `unlockedBy` : conditions optionnelles avant que l'indice ne soit visible.
 * Si `unlockedBy` est absent, l'indice est visible dès l'entrée dans la scène.
 */
export const ClueTypeSchema = z.enum(['text', 'image', 'audio', 'document'])
export type ClueType = z.infer<typeof ClueTypeSchema>

/**
 * Style visuel du rendu "papier" pour les indices texte/document.
 * - `letter` : lettre manuscrite (police cursive, papier légèrement froissé)
 * - `typed` : rapport tapé à la machine (police monospace/typewriter)
 * - `scan` : scan/photo de document posé sur un fond papier
 * Optionnel : si absent, le moteur choisit un style par défaut selon le
 * type d'indice (letter pour `text`, scan pour `document`).
 */
export const DocumentStyleSchema = z.enum(['letter', 'typed', 'scan'])
export type DocumentStyle = z.infer<typeof DocumentStyleSchema>

export const ClueSchema = z.object({
  id: z.string().min(1),
  type: ClueTypeSchema,
  title: z.string().min(1),
  /** Texte de l'indice, ou chemin relatif vers l'asset (assets/images/xxx.jpg, etc.) selon le type */
  content: z.string().min(1),
  /** Texte alternatif pour l'accessibilité (images/documents) */
  alt: z.string().optional(),
  /** Style de rendu "papier" optionnel pour les indices text/document (voir DocumentStyleSchema) */
  documentStyle: DocumentStyleSchema.optional(),
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
