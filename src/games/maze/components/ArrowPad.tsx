import type { Direction } from '../lib/types';
import styles from './ArrowPad.module.css';

export interface ArrowPadProps {
  onMove: (dir: Direction) => void;
  disabled?: boolean;
}

/** Big on-screen D-pad: the primary touch control for moving through the maze. */
export default function ArrowPad({ onMove, disabled = false }: ArrowPadProps) {
  return (
    <div className={styles.pad} role="group" aria-label="Move controls">
      <button
        type="button"
        className={`${styles.arrow} ${styles.up}`}
        onClick={() => onMove('up')}
        disabled={disabled}
        aria-label="Move up"
      >
        ▲
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.left}`}
        onClick={() => onMove('left')}
        disabled={disabled}
        aria-label="Move left"
      >
        ◀
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.right}`}
        onClick={() => onMove('right')}
        disabled={disabled}
        aria-label="Move right"
      >
        ▶
      </button>
      <button
        type="button"
        className={`${styles.arrow} ${styles.down}`}
        onClick={() => onMove('down')}
        disabled={disabled}
        aria-label="Move down"
      >
        ▼
      </button>
    </div>
  );
}
