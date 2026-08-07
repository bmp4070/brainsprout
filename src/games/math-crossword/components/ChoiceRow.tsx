import type { Blank } from '../lib/types';
import styles from './ChoiceRow.module.css';

export interface ChoiceRowProps {
  blank: Blank | null;
  /** Index the player just tapped wrongly (flashes red), or null. */
  wrongChoiceIndex: number | null;
  /** Bump counter so a repeated wrong tap re-triggers the flash. */
  wrongSeq: number;
  onAnswer: (blankId: number, choiceIndex: number) => void;
}

/**
 * The answer choices for the currently-selected blank. Four big number tiles;
 * a wrong tap flashes red (but the blank stays open to retry), a right tap is
 * handled upstream (the blank fills green in the grid).
 */
export default function ChoiceRow({ blank, wrongChoiceIndex, wrongSeq, onAnswer }: ChoiceRowProps) {
  if (blank === null) {
    return (
      <p className={styles.prompt} aria-live="polite">
        ✅ Every space is filled!
      </p>
    );
  }
  return (
    <div className={styles.wrap}>
      <p className={styles.prompt}>👇 Pick the number that fits the ? space</p>
      <div className={styles.choices} role="group" aria-label="Answer choices">
        {blank.choices.map((choice, index) => {
          const isWrong = index === wrongChoiceIndex;
          return (
            <button
              // key includes wrongSeq so a repeat wrong tap restarts the shake.
              key={`${index}-${isWrong ? wrongSeq : 'ok'}`}
              type="button"
              className={`${styles.choice} ${isWrong ? styles.wrong : ''}`}
              onClick={() => onAnswer(blank.id, index)}
              aria-label={`${choice}`}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
