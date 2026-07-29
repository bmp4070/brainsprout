import type { Problem } from '../lib/types';
import styles from './Feedback.module.css';

export interface FeedbackProps {
  problem: Problem;
  /** The choice index the kid picked for this problem (already answered). */
  selected: number;
}

/**
 * Cheerful/gentle feedback shown right after answering, alongside the
 * teaching visual so a kid who got it wrong can still see why.
 */
export default function Feedback({ problem, selected }: FeedbackProps) {
  const isCorrect = selected === problem.correctIndex;
  const symbol = problem.operation === 'subtract' ? '−' : '×';

  return (
    <p className={isCorrect ? styles.correct : styles.wrong} role="status">
      {isCorrect
        ? '🎉 Yes!'
        : `Not quite — it's ${problem.answer}! (${problem.a} ${symbol} ${problem.b} = ${problem.answer})`}
    </p>
  );
}
