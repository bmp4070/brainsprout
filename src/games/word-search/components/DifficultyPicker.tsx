import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  themeTitle: string;
  themeEmoji: string;
  timerEnabled: boolean;
  onToggleTimer: () => void;
  onPick: (difficulty: DifficultyConfig) => void;
  onSkipTheme: () => void;
}

export default function DifficultyPicker({
  themeTitle,
  themeEmoji,
  timerEnabled,
  onToggleTimer,
  onPick,
  onSkipTheme,
}: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Word Search</h1>
      <p className={styles.subtitle}>
        Up next: {themeEmoji} {themeTitle}
      </p>
      <button
        type="button"
        className={styles.skipButton}
        onClick={onSkipTheme}
      >
        🔀 Different book
      </button>
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
              {difficulty.gridSize}×{difficulty.gridSize}
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
