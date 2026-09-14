import { describe, expect, it } from 'vitest'
import { checkPuzzleAnswer } from '../puzzleEngine'
import type { Puzzle } from '../../../types/scenario'

describe('checkPuzzleAnswer', () => {
  it('valide un text-match insensible à la casse et aux accents', () => {
    const puzzle: Puzzle = {
      id: 'p1',
      type: 'text-match',
      prompt: 'Quel est le mot de passe ?',
      answers: ['Éléphant'],
      caseSensitive: false,
    }
    expect(checkPuzzleAnswer(puzzle, 'elephant').success).toBe(true)
    expect(checkPuzzleAnswer(puzzle, 'ELEPHANT').success).toBe(true)
    expect(checkPuzzleAnswer(puzzle, 'girafe').success).toBe(false)
  })

  it('valide un multiple-choice avec toutes les bonnes réponses', () => {
    const puzzle: Puzzle = {
      id: 'p2',
      type: 'multiple-choice',
      prompt: 'Sélectionnez les indices utiles',
      options: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      correctOptionIds: ['a', 'c'],
    }
    expect(checkPuzzleAnswer(puzzle, ['a', 'c']).success).toBe(true)
    expect(checkPuzzleAnswer(puzzle, ['c', 'a']).success).toBe(true)
    expect(checkPuzzleAnswer(puzzle, ['a']).success).toBe(false)
  })

  it('valide un code-pad numérique exact', () => {
    const puzzle: Puzzle = {
      id: 'p3',
      type: 'code-pad',
      prompt: 'Entrez le code',
      code: '1234',
    }
    expect(checkPuzzleAnswer(puzzle, '1234').success).toBe(true)
    expect(checkPuzzleAnswer(puzzle, '12345').success).toBe(false)
  })

  it('valide une sequence dans le bon ordre', () => {
    const puzzle: Puzzle = {
      id: 'p4',
      type: 'sequence',
      prompt: 'Remettez dans l\'ordre',
      items: [
        { id: 'x', label: 'X' },
        { id: 'y', label: 'Y' },
      ],
      correctOrder: ['y', 'x'],
    }
    expect(checkPuzzleAnswer(puzzle, ['y', 'x']).success).toBe(true)
    expect(checkPuzzleAnswer(puzzle, ['x', 'y']).success).toBe(false)
  })

  it('valide une combination-lock', () => {
    const puzzle: Puzzle = {
      id: 'p5',
      type: 'combination-lock',
      prompt: 'Réglez le cadenas',
      wheels: 3,
      combination: [1, 2, 3],
    }
    expect(checkPuzzleAnswer(puzzle, [1, 2, 3]).success).toBe(true)
    expect(checkPuzzleAnswer(puzzle, [3, 2, 1]).success).toBe(false)
  })
})
