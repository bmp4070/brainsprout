export type DifficultyId = 'easy' | 'medium' | 'hard';
export type Op = '−' | '×' | '+';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** Operators the puzzle may use (subtract & multiply are the taught ones). */
  ops: Op[];
  /** Max factor for a × equation (operands 1..maxFactor). */
  maxFactor: number;
  /** Max operand for a − / + equation. */
  maxTerm: number;
  /** How many cells are blanked for the player to fill. */
  blanks: number;
  /** Render grid edge length (size x size); grows with difficulty. */
  size: number;
  /** Number cells per side (odd); grows the footprint with difficulty. */
  ringPerSide: number;
  /**
   * How equations tile the board:
   * - 'full' = every row & column is an equation (fully filled; small sizes only).
   * - 'cross' = the four edges plus a middle row & column (filled centre, scales).
   * - 'ring'  = edges only (empty centre).
   */
  fill: 'full' | 'cross' | 'ring';
}

// The board literally grows with difficulty: a 3-number ring (5x5, 4 equations)
// The board grows with difficulty AND stays filled in the middle:
// - easy: a fully-filled 5x5 (every row & column an equation).
// - medium: a 9x9 whose centre is filled by a plus (ring + middle row/column).
// - hard: a 13x13 with the same filled-centre plus, numbers kept 2-digit so the
//   larger, tighter grid stays readable.
export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    emoji: '🐣',
    ops: ['−', '×'],
    maxFactor: 5,
    maxTerm: 10,
    blanks: 2,
    size: 5,
    ringPerSide: 3,
    fill: 'full',
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    emoji: '🦊',
    ops: ['−', '×'],
    maxFactor: 7,
    maxTerm: 20,
    blanks: 3,
    size: 9,
    ringPerSide: 5,
    fill: 'cross',
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    emoji: '🦉',
    ops: ['−', '×'],
    maxFactor: 9,
    maxTerm: 20,
    blanks: 4,
    size: 13,
    ringPerSide: 7,
    fill: 'cross',
  },
};

/** One cell in the 5x5 grid. */
export type Cell =
  | { kind: 'empty' }
  | { kind: 'op'; symbol: Op | '=' }
  | { kind: 'num'; value: number; blankId: number | null };

/** A blanked number cell the player must fill. */
export interface Blank {
  id: number;
  row: number;
  col: number;
  answer: number;
  /** 4 distinct non-negative choices; choices[correctIndex] === answer. */
  choices: number[];
  correctIndex: number;
}

export interface Puzzle {
  /** `size x size` render grid (row-major), where size = difficulty.size. */
  grid: Cell[][];
  blanks: Blank[];
  difficulty: DifficultyConfig;
  seed: number;
}
