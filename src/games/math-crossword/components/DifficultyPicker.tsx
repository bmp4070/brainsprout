import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  timerEnabled: boolean;
  onToggleTimer: () => void;
  onPick: (difficulty: DifficultyConfig) => void;
}

export default function DifficultyPicker({ timerEnabled, onToggleTimer, onPick }: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>➗ Math Crossword</h1>
      <p className={styles.rules}>
        ➖✖️ Fill the missing numbers so every row and column is a true equation!
      </p>
      <div className={styles.buttons}>
        {Object.values(DIFFICULTIES).map((difficulty) => (
          <button
            key={difficulty.id}
            type="button"
            className={styles.diffButton}
            onClick={() => onPick(difficulty)}
          >
            <span className={styles.diffEmoji} aria-hidden="true">
              {difficulty.emoji}
            </span>
            <span className={styles.diffLabel}>{difficulty.label}</span>
            <span className={styles.diffDetail}>
              🧩 {difficulty.size}×{difficulty.size} grid
            </span>
            <span className={styles.diffDetail}>🔢 {difficulty.blanks} to fill</span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.timerToggle} onClick={onToggleTimer}>
        {timerEnabled ? '⏱️ Timed' : '🐢 Relaxed'}
      </button>
    </div>
  );
}
