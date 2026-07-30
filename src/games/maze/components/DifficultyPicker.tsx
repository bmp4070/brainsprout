import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import type { MazeTheme } from '../lib/themes';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  upNextTheme: MazeTheme;
  onPick: (difficulty: DifficultyConfig) => void;
}

export default function DifficultyPicker({ upNextTheme, onPick }: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🧭 Maze</h1>
      <p className={styles.subtitle}>Find your way through the maze to the goal!</p>
      <p className={styles.rules}>
        🧭 Reach the {upNextTheme.goal} · Use the arrows or swipe · 💡 Hint shows the way!
      </p>
      <p className={styles.upNext}>
        Up next: {upNextTheme.character} {upNextTheme.name} → {upNextTheme.goal}
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
            <span className={styles.diffSize}>
              {difficulty.rows}×{difficulty.cols}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
