import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig } from '../lib/types';
import { sceneToDataUri } from '../scenes';
import type { RowRowScene } from '../scenes';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  scene: RowRowScene;
  timerEnabled: boolean;
  onToggleTimer: () => void;
  onPick: (difficulty: DifficultyConfig) => void;
  onSkipScene: () => void;
}

export default function DifficultyPicker({
  scene,
  timerEnabled,
  onToggleTimer,
  onPick,
  onSkipScene,
}: DifficultyPickerProps) {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🚣 Row Row</h1>
      <div
        className={styles.scenePreview}
        style={{ backgroundImage: `url("${sceneToDataUri(scene)}")` }}
        aria-hidden="true"
      />
      <p className={styles.subtitle}>
        Up next: {scene.emoji} {scene.title}
      </p>
      <button type="button" className={styles.skipButton} onClick={onSkipScene}>
        🔀 Different fjord
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
            <span className={styles.diffHint}>{difficulty.segmentCount} beats</span>
          </button>
        ))}
      </div>
      <button type="button" className={styles.skipButton} onClick={onToggleTimer}>
        {timerEnabled ? '⏱️ Timed' : '🐢 Relaxed'}
      </button>
    </div>
  );
}
