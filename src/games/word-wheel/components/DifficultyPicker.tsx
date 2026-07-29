import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  onPick: (difficulty: DifficultyConfig) => void;
}

/** "5 letters" when min===max, else "6–7 letters". */
function lengthCaption(difficulty: DifficultyConfig): string {
  const { baseLenMin, baseLenMax } = difficulty;
  return baseLenMin === baseLenMax ? `${baseLenMin} letters` : `${baseLenMin}–${baseLenMax} letters`;
}

export default function DifficultyPicker({ onPick }: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🎡 Word Wheel</h1>
      <p className={styles.subtitle}>Spin the letters and find every hidden word!</p>
      <p className={styles.rules}>
        🎡 Connect letters to spell words · 3 letters or more · ✨ Find them all!
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
            <span className={styles.diffSize}>{lengthCaption(difficulty)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
