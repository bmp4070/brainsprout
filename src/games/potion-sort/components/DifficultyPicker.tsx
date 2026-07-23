import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  onPick: (difficulty: DifficultyConfig) => void;
}

export default function DifficultyPicker({ onPick }: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🧪 Potion Sort</h1>
      <p className={styles.subtitle}>Pour the magic potions until every bottle is one color!</p>
      <p className={styles.rules}>
        🧪 Tap a bottle, then tap where to pour · 🎨 Colors only mix with their own kind · ✨ Make
        every bottle one color!
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
            <span className={styles.diffSize}>{difficulty.colorCount} potions</span>
          </button>
        ))}
      </div>
    </div>
  );
}
