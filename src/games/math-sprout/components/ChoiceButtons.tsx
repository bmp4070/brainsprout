import styles from './ChoiceButtons.module.css';

export interface ChoiceButtonsProps {
  choices: number[];
  correctIndex: number;
  /** Chosen choice index, or null if this question is unanswered. */
  selected: number | null;
  onSelect: (choiceIndex: number) => void;
  onNext: () => void;
}

/**
 * 4 big tappable answer bubbles. Once answered, the chosen bubble turns
 * green (correct) or red (wrong), the correct bubble is always highlighted
 * green, the rest are disabled, and a big "Next" button appears so the kid
 * explicitly advances (no surprise auto-advance, no countdown pressure).
 */
export default function ChoiceButtons({
  choices,
  correctIndex,
  selected,
  onSelect,
  onNext,
}: ChoiceButtonsProps) {
  const answered = selected !== null;

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        {choices.map((choice, index) => {
          const isCorrect = index === correctIndex;
          const isSelected = index === selected;

          let variant = styles.neutral;
          if (answered && isCorrect) variant = styles.correct;
          else if (answered && isSelected) variant = styles.wrong;

          let label = `${choice}`;
          if (answered) {
            label = isCorrect
              ? `${choice}, correct answer`
              : isSelected
                ? `${choice}, incorrect`
                : `${choice}`;
          }

          return (
            <button
              key={index}
              type="button"
              className={`${styles.choice} ${variant}`}
              disabled={answered}
              onClick={() => onSelect(index)}
              aria-label={label}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {answered && (
        <button type="button" className={styles.nextButton} onClick={onNext} aria-label="Next question">
          Next ▶
        </button>
      )}
    </div>
  );
}
