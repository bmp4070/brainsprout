export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** Square board edge length (size x size letters). */
  size: number;
  /** Inclusive minimum word length that counts. */
  minWordLen: number;
  /** How many valid words the player must find to win. */
  targetWords: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', size: 4, minWordLen: 3, targetWords: 5 },
  medium: { id: 'medium', label: 'Medium', emoji: '🦊', size: 5, minWordLen: 3, targetWords: 8 },
  hard: { id: 'hard', label: 'Hard', emoji: '🦉', size: 5, minWordLen: 4, targetWords: 12 },
};

/** A cell coordinate on the board (row, col), both 0-based. */
export interface Cell {
  row: number;
  col: number;
}

export interface Puzzle {
  /** `size x size` UPPERCASE letters, row-major. */
  grid: string[][];
  size: number;
  minWordLen: number;
  /** Every findable dictionary word (lowercase), sorted (length asc, then alpha). */
  solutions: string[];
  targetWords: number;
  seed: number;
}
