import { useState } from 'react';
import { DIFFICULTIES, OPERATIONS } from '../lib/types';
import type { DifficultyConfig, OperationId, OperationMeta } from '../lib/types';
import styles from './OperationPicker.module.css';

export interface OperationPickerProps {
  onStart: (operation: OperationId, difficulty: DifficultyConfig) => void;
}

const OPERATION_SUBTITLE: Record<OperationId, string> = {
  subtract: 'Take away and see what’s left!',
  multiply: 'Count groups the fast way!',
};

/**
 * Two-step picker: choose an operation, then reveal the 3 difficulty levels
 * for it. `onStart` fires once both are chosen.
 */
export default function OperationPicker({ onStart }: OperationPickerProps) {
  const [operation, setOperation] = useState<OperationMeta | null>(null);

  if (!operation) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>🧮 Math Sprout</h1>
        <p className={styles.subtitle}>Pick what you want to practice!</p>
        <div className={styles.opButtons}>
          {OPERATIONS.map((op) => (
            <button
              key={op.id}
              type="button"
              className={styles.opButton}
              onClick={() => setOperation(op)}
            >
              <span className={styles.opEmoji} aria-hidden="true">
                {op.emoji}
              </span>
              <span className={styles.opLabel}>{op.label}</span>
              <span className={styles.opSubtitle}>{OPERATION_SUBTITLE[op.id]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.backButton}
        onClick={() => setOperation(null)}
        aria-label="Back to operation choice"
      >
        ◀ Back
      </button>
      <h1 className={styles.title}>
        {operation.emoji} {operation.label}
      </h1>
      <p className={styles.subtitle}>Choose a level!</p>
      <div className={styles.buttons}>
        {Object.values(DIFFICULTIES).map((difficulty) => (
          <button
            key={difficulty.id}
            type="button"
            className={styles.diffButton}
            onClick={() => onStart(operation.id, difficulty)}
          >
            <span className={styles.diffEmoji} aria-hidden="true">
              {difficulty.emoji}
            </span>
            <span className={styles.diffLabel}>{difficulty.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
