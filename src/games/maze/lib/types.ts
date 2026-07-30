export interface Cell {
  r: number;
  c: number;
}

export type Direction = 'up' | 'right' | 'down' | 'left';

/** All four directions in clockwise order starting from up. */
export const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

/** Bit per direction for the open-passage mask: up=1, right=2, down=4, left=8. */
export const DIR_BIT: Record<Direction, number> = {
  up: 1,
  right: 2,
  down: 4,
  left: 8,
};

/** Row/col delta per direction (up = r-1, right = c+1, down = r+1, left = c-1). */
export const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  right: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
};

/** Returns the direction pointing the opposite way. */
export function opposite(d: Direction): Direction {
  switch (d) {
    case 'up':
      return 'down';
    case 'right':
      return 'left';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
  }
}

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  rows: number;
  cols: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', rows: 8, cols: 8 },
  medium: { id: 'medium', label: 'Medium', emoji: '🐉', rows: 12, cols: 12 },
  hard: { id: 'hard', label: 'Hard', emoji: '🔥', rows: 16, cols: 16 },
};

export interface Maze {
  rows: number;
  cols: number;
  /** open[r][c] = bitmask of directions with a passage (no wall). */
  open: number[][];
  start: Cell; // {r:0,c:0}
  goal: Cell; // {r:rows-1,c:cols-1}
  seed: number;
}

/** Stable string key for a cell, `${r},${c}`. */
export function cellKey(cell: Cell): string {
  return `${cell.r},${cell.c}`;
}
