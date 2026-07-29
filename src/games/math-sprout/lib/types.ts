export type OperationId = 'subtract' | 'multiply';
export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface OperationMeta {
  id: OperationId;
  label: string;
  symbol: string;
  emoji: string;
}

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
}

/** The two practiceable operations, in picker display order. */
export const OPERATIONS: OperationMeta[] = [
  { id: 'subtract', label: 'Subtraction', symbol: '−', emoji: '➖' },
  { id: 'multiply', label: 'Multiplication', symbol: '×', emoji: '✖️' },
];

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣' },
  medium: { id: 'medium', label: 'Medium', emoji: '🐉' },
  hard: { id: 'hard', label: 'Hard', emoji: '🔥' },
};

/** One generated question, plus the 4-choice answer set for it. */
export interface Problem {
  a: number;
  b: number;
  operation: OperationId;
  answer: number;
  /** Exactly 4 distinct, non-negative choices; `choices[correctIndex] === answer`. */
  choices: number[];
  correctIndex: number;
}

/** Number of questions in a round. */
export const ROUND_LENGTH = 10;
