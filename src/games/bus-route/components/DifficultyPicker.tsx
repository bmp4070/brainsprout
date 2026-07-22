import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  onPick: (difficulty: DifficultyConfig) => void;
}

export default function DifficultyPicker({ onPick }: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🚌 School Bus Route</h1>
      <p className={styles.subtitle}>Plan the shortest route to pick up every kid!</p>
      <p className={styles.rules}>
        🚌 Tap houses in pickup order · 🛣️ The bus drives only on streets · ⛽ Shorter routes save fuel!
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
            <span className={styles.diffSize}>{difficulty.stopCount} stops</span>
          </button>
        ))}
      </div>
    </div>
  );
}
