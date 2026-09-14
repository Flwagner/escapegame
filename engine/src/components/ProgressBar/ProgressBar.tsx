import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  solvedCount: number
  totalCount: number
}

export function ProgressBar({ solvedCount, totalCount }: ProgressBarProps) {
  const percent = totalCount > 0 ? Math.min(100, Math.max(0, Math.round((solvedCount / totalCount) * 100))) : 0

  return (
    <div className={styles.wrapper} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${percent}%` }} />
      </div>
      <span className={styles.label}>
        {solvedCount} / {totalCount} énigmes résolues
      </span>
    </div>
  )
}
