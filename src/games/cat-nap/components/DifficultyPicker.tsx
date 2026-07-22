import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import CatSprite from './CatSprite';
import styles from './DifficultyPicker.module.css';

const CAT_VARIANT_COUNT = 6;

export interface DifficultyPickerProps {
  timerEnabled: boolean;
  onToggleTimer: () => void;
  onPick: (difficulty: DifficultyConfig) => void;
}

export default function DifficultyPicker({
  timerEnabled,
  onToggleTimer,
  onPick,
}: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🐱 Cat Nap</h1>
      <p className={styles.subtitle}>Tuck a sleepy cat into every color!</p>
      <p className={styles.rules}>
        🐱 One cat per color · 🚫 No sharing rows or columns · 🙅 No touching!
      </p>
      <div className={styles.catStrip} aria-hidden="true">
        {Array.from({ length: CAT_VARIANT_COUNT }, (_, variant) => (
          <CatSprite key={variant} variant={variant} size={28} />
        ))}
      </div>
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
            <span className={styles.diffSize}>
              {difficulty.size}×{difficulty.size}
            </span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.timerToggle} onClick={onToggleTimer}>
        {timerEnabled ? '⏱️ Timed' : '🐢 Relaxed'}
      </button>
    </div>
  );
}
