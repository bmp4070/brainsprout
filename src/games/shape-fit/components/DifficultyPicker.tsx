import { DIFFICULTIES } from '../lib/types';
import type { Backdrop, DifficultyConfig } from '../lib/types';
import styles from './DifficultyPicker.module.css';

export interface DifficultyPickerProps {
  upNextBackdrop: Backdrop;
  onPick: (difficulty: DifficultyConfig) => void;
}

const BACKDROP_LABEL: Record<Backdrop, { name: string; emoji: string }> = {
  diamond: { name: 'Diamond', emoji: '🔶' },
  rhombus: { name: 'Rhombus', emoji: '🔷' },
};

export default function DifficultyPicker({ upNextBackdrop, onPick }: DifficultyPickerProps) {
  const upNext = BACKDROP_LABEL[upNextBackdrop];

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>🔷 Shape Fit</h1>
      <p className={styles.subtitle}>Rotate and flip tangram pieces to fill every shape!</p>
      <p className={styles.rules}>
        🔷 Drag pieces into the shape · 🔄 rotate, ↔️ flip to fit · ✨ Fill every triangle!
      </p>
      <p className={styles.upNext}>
        Up next: {upNext.emoji} {upNext.name}
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
            <span className={styles.diffSize}>up to {difficulty.maxPieces} pieces</span>
          </button>
        ))}
      </div>
    </div>
  );
}
