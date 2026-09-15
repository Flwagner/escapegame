import { useEffect, useState } from 'react'
import type { GameOutcome } from '../../core/state/gameStore'
import { formatRemainingTime, getRemainingSeconds } from './timerUtils'
import styles from './GameTimer.module.css'

interface GameTimerProps {
  deadlineAt: number
  pausedAt: number | null
  stoppedAt: number | null
  outcome: GameOutcome
  onExpire: () => void
}

export function GameTimer({ deadlineAt, pausedAt, stoppedAt, outcome, onExpire }: GameTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    outcome === 'lost' ? 0 : getRemainingSeconds(deadlineAt, pausedAt ?? stoppedAt ?? Date.now()),
  )

  useEffect(() => {
    const update = () => {
      const remaining = outcome === 'lost'
        ? 0
        : getRemainingSeconds(deadlineAt, pausedAt ?? stoppedAt ?? Date.now())
      setRemainingSeconds(remaining)
      if (remaining === 0 && outcome === null && pausedAt === null) onExpire()
    }

    update()
    if (pausedAt !== null || outcome !== null) return
    const interval = window.setInterval(update, 250)
    return () => window.clearInterval(interval)
  }, [deadlineAt, onExpire, outcome, pausedAt, stoppedAt])

  const critical = outcome === null && remainingSeconds <= 60
  const stateLabel = outcome === 'won' ? 'Terminé' : pausedAt !== null ? 'En pause' : critical ? 'Temps critique' : 'Temps restant'

  return (
    <div
      className={`${styles.timer} ${critical ? styles.critical : ''} ${outcome === 'won' ? styles.complete : ''}`}
      role="timer"
      aria-label={`${stateLabel} : ${formatRemainingTime(remainingSeconds)}`}
    >
      <span className={styles.label}>{stateLabel}</span>
      <strong className={styles.value}>{formatRemainingTime(remainingSeconds)}</strong>
    </div>
  )
}
