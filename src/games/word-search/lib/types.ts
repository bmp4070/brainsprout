export interface CellPos {
  row: number;
  col: number;
}

export interface Direction {
  dr: -1 | 0 | 1;
  dc: -1 | 0 | 1;
}

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  gridSize: number;
  wordCount: number;
  directions: Direction[];
}

export interface Placement {
  word: string;
  cells: CellPos[];
}

export interface Puzzle {
  size: number;
  grid: string[][];
  placements: Placement[];
  seed: number;
}

export interface WordTheme {
  id: string;
  title: string;
  emoji: string;
  words: Record<DifficultyId, string[]>;
  /** Maps each uppercase word to a short, kid-friendly trivia fact about it. */
  facts: Record<string, string>;
}

const EAST: Direction = { dr: 0, dc: 1 };
const SOUTH: Direction = { dr: 1, dc: 0 };
const SOUTH_EAST: Direction = { dr: 1, dc: 1 };
const NORTH_EAST: Direction = { dr: -1, dc: 1 };
const WEST: Direction = { dr: 0, dc: -1 };
const NORTH: Direction = { dr: -1, dc: 0 };
const NORTH_WEST: Direction = { dr: -1, dc: -1 };
const SOUTH_WEST: Direction = { dr: 1, dc: -1 };

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    emoji: '🐣',
    gridSize: 8,
    wordCount: 5,
    directions: [EAST, SOUTH],
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    emoji: '🐉',
    gridSize: 10,
    wordCount: 7,
    directions: [EAST, SOUTH, SOUTH_EAST, NORTH_EAST],
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    emoji: '🔥',
    gridSize: 12,
    wordCount: 9,
    directions: [
      EAST,
      SOUTH,
      SOUTH_EAST,
      NORTH_EAST,
      WEST,
      NORTH,
      NORTH_WEST,
      SOUTH_WEST,
    ],
  },
};
