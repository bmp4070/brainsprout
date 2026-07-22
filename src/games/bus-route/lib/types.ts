/** A point in map coordinates (0..100 on both axes). */
export interface Point {
  x: number;
  y: number;
}

/** A house stop. `id` is its stable index 0..N-1 within the layout. */
export interface Stop extends Point {
  id: number;
}

/** A generated map: the school and the houses to visit, plus the seed used. */
export interface Layout {
  school: Point;
  stops: Stop[];
  seed: number;
}

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  stopCount: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', stopCount: 5 },
  medium: { id: 'medium', label: 'Medium', emoji: '🐉', stopCount: 7 },
  hard: { id: 'hard', label: 'Hard', emoji: '🔥', stopCount: 9 },
};
