import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  onPick: (difficulty: DifficultyConfig) => void;
}

export default function DifficultyPicker({ onPick }: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🔷 Shape Fit</h1>
      <p className={styles.subtitle}>Rotate and flip the blocks to fill every shape!</p>
      <p className={styles.rules}>
        🔷 Drag blocks into the shape · 🔄 Tap to rotate, ↔️ to flip · ✨ Fill every square!
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
            <span className={styles.diffSize}>{difficulty.targetCells} cells</span>
          </button>
        ))}
      </div>
    </div>
  );
}
