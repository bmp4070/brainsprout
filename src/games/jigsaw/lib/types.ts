export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** Pieces across (columns). */
  cols: number;
  /** Pieces down (rows). */
  rows: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', cols: 4, rows: 2 }, // 8 pieces
  medium: { id: 'medium', label: 'Medium', emoji: '🐉', cols: 4, rows: 4 }, // 16 pieces
  hard: { id: 'hard', label: 'Hard', emoji: '🔥', cols: 8, rows: 4 }, // 32 pieces
};

/** Total piece count for a difficulty. */
export function pieceCount(difficulty: DifficultyConfig): number {
  return difficulty.cols * difficulty.rows;
}
