import { z } from 'zod'

/**
 * Types d'énigmes supportés nativement par le moteur.
 * Chaque type est résolu par un validateur générique dans `puzzleEngine.ts`.
 * Ajouter un nouveau type ici = étendre le moteur (ne concerne jamais un scénario en particulier).
 */
export const PuzzleTypeSchema = z.enum([
  'text-match',
  'multiple-choice',
  'code-pad',
  'sequence',
  'combination-lock',
])
export type PuzzleType = z.infer<typeof PuzzleTypeSchema>

const BasePuzzleSchema = z.object({
  id: z.string().min(1),
  type: PuzzleTypeSchema,
  prompt: z.string().min(1),
  hint: z.string().optional(),
  /** Nombre max de tentatives avant affichage d'un indice (optionnel) */
  maxAttempts: z.number().int().positive().optional(),
  /** Récompense accordée en cas de succès : id(s) d'indice ou d'item d'inventaire à débloquer */
  rewards: z
    .object({
      unlockClues: z.array(z.string()).optional(),
      unlockItems: z.array(z.string()).optional(),
      unlockScenes: z.array(z.string()).optional(),
    })
    .optional(),
})

export const TextMatchPuzzleSchema = BasePuzzleSchema.extend({
  type: z.literal('text-match'),
  /** Comparaison insensible à la casse/accents par défaut */
  answers: z.array(z.string().min(1)).min(1),
  caseSensitive: z.boolean().optional().default(false),
})

export const MultipleChoicePuzzleSchema = BasePuzzleSchema.extend({
  type: z.literal('multiple-choice'),
  options: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
  correctOptionIds: z.array(z.string()).min(1),
})

export const CodePadPuzzleSchema = BasePuzzleSchema.extend({
  type: z.literal('code-pad'),
  code: z.string().regex(/^[0-9]+$/, 'Le code doit être numérique'),
})

export const SequencePuzzleSchema = BasePuzzleSchema.extend({
  type: z.literal('sequence'),
  items: z.array(z.object({ id: z.string(), label: z.string() })).min(2),
  correctOrder: z.array(z.string()).min(2),
})

export const CombinationLockPuzzleSchema = BasePuzzleSchema.extend({
  type: z.literal('combination-lock'),
  /** ex: nombre de roues et valeur attendue par roue */
  wheels: z.number().int().min(1).max(6),
  combination: z.array(z.number().int().min(0).max(9)),
})

export const PuzzleSchema = z.discriminatedUnion('type', [
  TextMatchPuzzleSchema,
  MultipleChoicePuzzleSchema,
  CodePadPuzzleSchema,
  SequencePuzzleSchema,
  CombinationLockPuzzleSchema,
])
export type Puzzle = z.infer<typeof PuzzleSchema>
