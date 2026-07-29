export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** Inclusive minimum base-word length (== rack size). */
  baseLenMin: number;
  /** Inclusive maximum base-word length (== rack size). */
  baseLenMax: number;
  /** Inclusive minimum number of target words on the board. */
  minWords: number;
  /** Inclusive maximum number of target words on the board. */
  maxWords: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    emoji: '🐣',
    baseLenMin: 5,
    baseLenMax: 5,
    minWords: 5,
    maxWords: 9,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    emoji: '🐉',
    baseLenMin: 6,
    baseLenMax: 7,
    minWords: 8,
    maxWords: 16,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    emoji: '🔥',
    baseLenMin: 8,
    baseLenMax: 9,
    minWords: 12,
    maxWords: 26,
  },
};

export interface Puzzle {
  /** The rack, UPPERCASE, shuffled (length == base word length). */
  letters: string[];
  /** Uppercase; one of the target words, uses ALL rack letters. */
  baseWord: string;
  /** All target words to find, lowercase, sorted by (length asc, then alpha). */
  words: string[];
  seed: number;
}
