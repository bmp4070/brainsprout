import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import type { Theme } from '../lib/themes';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  /** The theme the next puzzle will use, shown so kids know what's coming. */
  upNextTheme: Theme;
  timerEnabled: boolean;
  onToggleTimer: () => void;
  onPick: (difficulty: DifficultyConfig) => void;
}

export default function DifficultyPicker({
  upNextTheme,
  timerEnabled,
  onToggleTimer,
  onPick,
}: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>👀 Spot the Difference</h1>
      <p className={styles.subtitle}>
        Up next: {upNextTheme.emoji} {upNextTheme.name}
      </p>
      <p className={styles.rules}>
        👀 Find what&rsquo;s different between the two pictures · Tap the differences · ✨ Find
        them all!
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
            <span className={styles.diffSize}>{difficulty.diffCount} differences</span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.timerToggle} onClick={onToggleTimer}>
        {timerEnabled ? '⏱️ Timed' : '🐢 Relaxed'}
      </button>
    </div>
  );
}
