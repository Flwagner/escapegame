import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useGameStore } from '../../core/state/gameStore'
import { audioManager } from '../../core/audio/audioManager'
import type { Puzzle } from '../../types/scenario'
import styles from './PuzzleModal.module.css'

interface PuzzleModalProps {
  puzzle: Puzzle | null
  onClose: () => void
  onSolved: () => void
}

export function PuzzleModal({ puzzle, onClose, onSolved }: PuzzleModalProps) {
  const attemptPuzzle = useGameStore((s) => s.attemptPuzzle)
  const [textAnswer, setTextAnswer] = useState('')
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [codeAnswer, setCodeAnswer] = useState('')
  const [wheelValues, setWheelValues] = useState<number[]>([])
  const [feedback, setFeedback] = useState<'idle' | 'error'>('idle')

  if (!puzzle) return null

  function resetLocalState() {
    setTextAnswer('')
    setSelectedOptionIds([])
    setCodeAnswer('')
    setWheelValues([])
    setFeedback('idle')
  }

  function handleClose() {
    resetLocalState()
    onClose()
  }

  function submit(answer: unknown) {
    const result = attemptPuzzle(puzzle!.id, answer)
    if (result.success) {
      audioManager.playSfx(`${import.meta.env.BASE_URL}sfx/success.mp3`)
      resetLocalState()
      onSolved()
    } else {
      audioManager.playSfx(`${import.meta.env.BASE_URL}sfx/error.mp3`)
      setFeedback('error')
    }
  }

  const wheels = puzzle.type === 'combination-lock' ? puzzle.wheels : 0
  const currentWheelValues = wheelValues.length === wheels ? wheelValues : Array(wheels).fill(0)

  return (
    <AnimatePresence>
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <button type="button" className={`${styles.closeButton} eg-tap-target`} onClick={handleClose} aria-label="Fermer">
            ✕
          </button>
          <p className={styles.prompt}>{puzzle.prompt}</p>

          {puzzle.type === 'text-match' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit(textAnswer)
              }}
            >
              <input
                className={styles.textInput}
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Votre réponse"
                autoFocus
              />
              <button type="submit" className={`${styles.submitButton} eg-tap-target`}>
                Valider
              </button>
            </form>
          )}

          {puzzle.type === 'multiple-choice' && (
            <div>
              <ul className={styles.optionList}>
                {puzzle.options.map((option) => {
                  const selected = selectedOptionIds.includes(option.id)
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        className={`${styles.option} eg-tap-target ${selected ? styles.optionSelected : ''}`}
                        onClick={() =>
                          setSelectedOptionIds((prev) =>
                            prev.includes(option.id)
                              ? prev.filter((id) => id !== option.id)
                              : [...prev, option.id],
                          )
                        }
                      >
                        {option.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <button
                type="button"
                className={`${styles.submitButton} eg-tap-target`}
                onClick={() => submit(selectedOptionIds)}
              >
                Valider
              </button>
            </div>
          )}

          {puzzle.type === 'code-pad' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                submit(codeAnswer)
              }}
            >
              <input
                className={styles.textInput}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={codeAnswer}
                onChange={(e) => setCodeAnswer(e.target.value.replace(/\D/g, ''))}
                placeholder="Code"
                autoFocus
              />
              <button type="submit" className={`${styles.submitButton} eg-tap-target`}>
                Valider
              </button>
            </form>
          )}

          {puzzle.type === 'combination-lock' && (
            <div>
              <div className={styles.wheelRow}>
                {Array.from({ length: wheels }).map((_, i) => (
                  <div key={i} className={styles.wheel}>
                    <button
                      type="button"
                      className="eg-tap-target"
                      onClick={() =>
                        setWheelValues(() => {
                          const next = [...currentWheelValues]
                          next[i] = (next[i] + 1) % 10
                          return next
                        })
                      }
                    >
                      ▲
                    </button>
                    <span className={styles.wheelValue}>{currentWheelValues[i]}</span>
                    <button
                      type="button"
                      className="eg-tap-target"
                      onClick={() =>
                        setWheelValues(() => {
                          const next = [...currentWheelValues]
                          next[i] = (next[i] + 9) % 10
                          return next
                        })
                      }
                    >
                      ▼
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`${styles.submitButton} eg-tap-target`}
                onClick={() => submit(currentWheelValues)}
              >
                Valider
              </button>
            </div>
          )}

          {puzzle.type === 'sequence' && (
            <SequencePuzzleForm puzzle={puzzle} onSubmit={submit} />
          )}

          {feedback === 'error' && (
            <p className={styles.errorText}>{puzzle.hint ?? 'Ce n\u2019est pas la bonne réponse, essayez encore.'}</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function SequencePuzzleForm({
  puzzle,
  onSubmit,
}: {
  puzzle: Extract<Puzzle, { type: 'sequence' }>
  onSubmit: (answer: string[]) => void
}) {
  const [order, setOrder] = useState<string[]>([])

  function toggle(id: string) {
    setOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div>
      <ul className={styles.optionList}>
        {puzzle.items.map((item) => {
          const position = order.indexOf(item.id)
          return (
            <li key={item.id}>
              <button
                type="button"
                className={`${styles.option} eg-tap-target ${position >= 0 ? styles.optionSelected : ''}`}
                onClick={() => toggle(item.id)}
              >
                {item.label} {position >= 0 && <span className={styles.badgeIndex}>{position + 1}</span>}
              </button>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        className={`${styles.submitButton} eg-tap-target`}
        disabled={order.length !== puzzle.items.length}
        onClick={() => onSubmit(order)}
      >
        Valider l'ordre
      </button>
    </div>
  )
}
