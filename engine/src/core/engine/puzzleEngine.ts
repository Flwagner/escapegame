import type { Puzzle } from '../../types/scenario'

export interface PuzzleAttemptResult {
  success: boolean
  message?: string
}

function normalize(value: string, caseSensitive: boolean): string {
  const v = caseSensitive ? value : value.toLowerCase()
  return v
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents pour une comparaison plus tolérante
}

/**
 * Valide une tentative de résolution pour un puzzle donné.
 * `answer` a une forme différente selon le type de puzzle :
 * - text-match: string
 * - multiple-choice: string[] (ids des options sélectionnées)
 * - code-pad: string (chiffres saisis)
 * - sequence: string[] (ids dans l'ordre proposé)
 * - combination-lock: number[] (valeur de chaque roue)
 */
export function checkPuzzleAnswer(puzzle: Puzzle, answer: unknown): PuzzleAttemptResult {
  switch (puzzle.type) {
    case 'text-match': {
      const value = String(answer ?? '')
      const normalizedAnswer = normalize(value, puzzle.caseSensitive)
      const isCorrect = puzzle.answers.some(
        (candidate) => normalize(candidate, puzzle.caseSensitive) === normalizedAnswer,
      )
      return { success: isCorrect }
    }
    case 'multiple-choice': {
      const selected = Array.isArray(answer) ? (answer as string[]) : []
      const expected = new Set(puzzle.correctOptionIds)
      const isCorrect =
        selected.length === expected.size && selected.every((id) => expected.has(id))
      return { success: isCorrect }
    }
    case 'code-pad': {
      const value = String(answer ?? '')
      return { success: value === puzzle.code }
    }
    case 'sequence': {
      const order = Array.isArray(answer) ? (answer as string[]) : []
      const isCorrect =
        order.length === puzzle.correctOrder.length &&
        order.every((id, i) => id === puzzle.correctOrder[i])
      return { success: isCorrect }
    }
    case 'combination-lock': {
      const values = Array.isArray(answer) ? (answer as number[]) : []
      const isCorrect =
        values.length === puzzle.combination.length &&
        values.every((v, i) => v === puzzle.combination[i])
      return { success: isCorrect }
    }
    default: {
      const _exhaustive: never = puzzle
      return _exhaustive
    }
  }
}
