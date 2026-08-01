import BigButton from '../../../shared/components/BigButton';
import ItemTile from './ItemTile';
import styles from './StudyGrid.module.css';

export interface StudyGridProps {
  studied: string[];
  msLeft: number;
  msTotal: number;
  /** How many of these items the player will need to catch on the belt. */
  targetCount: number;
  onReady: () => void;
}

/** The study phase: every item shown at once with a shrinking countdown. */
export default function StudyGrid({ studied, msLeft, msTotal, targetCount, onReady }: StudyGridProps) {
  const secondsLeft = Math.ceil(msLeft / 1000);
  const pct = msTotal > 0 ? Math.max(0, Math.min(100, (msLeft / msTotal) * 100)) : 0;
  const low = secondsLeft <= 5;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h2 className={styles.title}>🧠 Memorize these!</h2>
        <p className={styles.subtitle}>
          You&rsquo;ll have to spot {targetCount} of them on the belt.
        </p>
      </div>

      <div className={styles.countdown}>
        <span className={`${styles.seconds} ${low ? styles.secondsLow : ''}`} aria-live="polite">
          ⏳ {secondsLeft}s
        </span>
        <div className={styles.barTrack} aria-hidden="true">
          <div className={`${styles.barFill} ${low ? styles.barFillLow : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={styles.grid} role="list" aria-label="Items to memorize">
        {studied.map((itemId) => (
          <div role="listitem" key={itemId}>
            <ItemTile itemId={itemId} />
          </div>
        ))}
      </div>

      <BigButton onClick={onReady}>👍 I&rsquo;m ready!</BigButton>
    </div>
  );
}
