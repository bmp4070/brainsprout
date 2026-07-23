/** Every bottle holds at most this many liquid units. */
export const CAPACITY = 4;

/**
 * A bottle's contents, stored bottom -> top. Each entry is a color index in
 * `0..colorCount-1`. An empty array is an empty bottle.
 */
export type Bottle = number[];

/** The whole board: a fixed-length list of bottles, addressed by index. */
export type BoardState = Bottle[];

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** Number of distinct colors; each color has exactly CAPACITY units. */
  colorCount: number;
  /** Extra bottles that start empty (working space). */
  emptyBottles: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', colorCount: 3, emptyBottles: 2 },
  medium: { id: 'medium', label: 'Medium', emoji: '🐉', colorCount: 5, emptyBottles: 2 },
  hard: { id: 'hard', label: 'Hard', emoji: '🔥', colorCount: 7, emptyBottles: 2 },
};

/** Total bottles on the board for a difficulty. */
export function bottleCount(difficulty: DifficultyConfig): number {
  return difficulty.colorCount + difficulty.emptyBottles;
}

export interface Puzzle {
  board: BoardState;
  difficulty: DifficultyId;
  seed: number;
  /** Minimum number of pours needed (or a best estimate when !parExact). */
  par: number;
  /** True when `par` is the proven minimum (BFS finished within its budget). */
  parExact: boolean;
}
