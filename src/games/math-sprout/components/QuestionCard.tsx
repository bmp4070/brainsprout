import type { Problem } from '../lib/types';
import SubtractionVisual from './SubtractionVisual';
import MultiplicationVisual from './MultiplicationVisual';
import Feedback from './Feedback';
import ChoiceButtons from './ChoiceButtons';
import styles from './QuestionCard.module.css';

export interface QuestionCardProps {
  problem: Problem;
  /** Chosen choice index, or null if this question is unanswered. */
  selected: number | null;
  onAnswer: (choiceIndex: number) => void;
  onNext: () => void;
}

/**
 * Shows the problem ("a − b = ?" / "a × b = ?"), the matching teaching
 * visual, feedback once answered, and the 4 answer choices.
 */
export default function QuestionCard({ problem, selected, onAnswer, onNext }: QuestionCardProps) {
  const symbol = problem.operation === 'subtract' ? '−' : '×';

  return (
    <div className={styles.card}>
      <p className={styles.equation}>
        {problem.a} {symbol} {problem.b} = ?
      </p>
      {selected !== null && <Feedback problem={problem} selected={selected} />}
      <div className={styles.visual}>
        {problem.operation === 'subtract' ? (
          <SubtractionVisual a={problem.a} b={problem.b} answer={problem.answer} />
        ) : (
          <MultiplicationVisual a={problem.a} b={problem.b} />
        )}
      </div>
      <ChoiceButtons
        choices={problem.choices}
        correctIndex={problem.correctIndex}
        selected={selected}
        onSelect={onAnswer}
        onNext={onNext}
      />
    </div>
  );
}
