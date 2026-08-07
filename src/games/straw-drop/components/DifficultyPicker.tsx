import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  timerEnabled: boolean;
  onToggleTimer: () => void;
  onPick: (difficulty: DifficultyConfig) => void;
}

function mouthLabel(tolerance: number): string {
  if (tolerance >= 6) return 'wide mouth';
  if (tolerance >= 4) return 'medium mouth';
  return 'narrow mouth';
}

export default function DifficultyPicker({ timerEnabled, onToggleTimer, onPick }: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🥤 Straw Drop</h1>
      <p className={styles.rules}>
        ⬇️ Bottles roll by on the belt — press <strong>Space</strong> or tap to drop the straw into a
        bottle. ✨ Fill them all!
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
            <span className={styles.diffDetail}>🍼 fill {difficulty.target}</span>
            <span className={styles.diffDetail}>🎯 {mouthLabel(difficulty.mouthTolerance)}</span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.timerToggle} onClick={onToggleTimer}>
        {timerEnabled ? '⏱️ Timed' : '🐢 Relaxed'}
      </button>
    </div>
  );
}
