/** A single grid cell address. */
export interface Cell {
  r: number;
  c: number;
}

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  rows: number;
  cols: number;
  targetCells: number;
  maxPieces: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', rows: 5, cols: 5, targetCells: 10, maxPieces: 4 },
  medium: {
    id: 'medium',
    label: 'Medium',
    emoji: '🐉',
    rows: 6,
    cols: 6,
    targetCells: 16,
    maxPieces: 5,
  },
  hard: { id: 'hard', label: 'Hard', emoji: '🔥', rows: 7, cols: 7, targetCells: 24, maxPieces: 6 },
};

/**
 * A tray piece instance. `cells` is the piece's BASE shape, normalized
 * (min r = 0, min c = 0, sorted by (r, c)). colorIndex is 0..6.
 */
export interface Piece {
  id: number;
  cells: Cell[];
  colorIndex: number;
}

/** One piece placed at absolute board cells (generator solution + hints). */
export interface Placement {
  pieceId: number;
  cells: Cell[];
}

export interface Puzzle {
  rows: number;
  cols: number;
  /** region[r][c] true = cell is inside the target outline. */
  region: boolean[][];
  pieces: Piece[];
  /** One valid full tiling (pieceId ↔ pieces[].id). */
  solution: Placement[];
  seed: number;
}

/** Stable string key for a cell: `${r},${c}`. */
export function cellKey(cell: Cell): string {
  return `${cell.r},${cell.c}`;
}
