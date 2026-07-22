export interface CellPos {
  row: number;
  col: number;
}

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  size: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', size: 4 },
  medium: { id: 'medium', label: 'Medium', emoji: '🐉', size: 5 },
  hard: { id: 'hard', label: 'Hard', emoji: '🔥', size: 6 },
};

export interface Puzzle {
  size: number;
  /** regions[row][col] = region index 0..size-1; each region is contiguous (4-connected). */
  regions: number[][];
  /** solution[i] is the unique correct cat cell for region i. */
  solution: CellPos[];
  seed: number;
}

export type CellMark = 'empty' | 'cat' | 'paw';

/** Stable string key for a cell, e.g. "2,3". */
export function cellKey(pos: CellPos): string {
  return `${pos.row},${pos.col}`;
}
