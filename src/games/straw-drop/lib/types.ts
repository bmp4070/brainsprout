export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** Belt speed in field units per second (bottles move right → left). */
  beltSpeed: number;
  /** Distance between bottle centers, in field units. */
  gap: number;
  /** Half-width of a bottle's mouth: a drop hits if |bottleX − dropX| ≤ this. */
  mouthTolerance: number;
  /** How long a dropped straw takes to reach the belt, in seconds. */
  fallSeconds: number;
  /** Bottles the player must fill to win. */
  target: number;
}

// `mouthTolerance` is BOTH the catch half-width and (doubled) the drawn opening,
// so the hole you see is exactly the hole you must hit. Easy = wide mouth, hard
// = narrow mouth.
export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', beltSpeed: 16, gap: 30, mouthTolerance: 7.5, fallSeconds: 0.22, target: 5 },
  medium: { id: 'medium', label: 'Medium', emoji: '🦊', beltSpeed: 26, gap: 26, mouthTolerance: 4.6, fallSeconds: 0.22, target: 8 },
  hard: { id: 'hard', label: 'Hard', emoji: '🦉', beltSpeed: 38, gap: 22, mouthTolerance: 2.8, fallSeconds: 0.2, target: 12 },
};

/** One bottle riding the belt. `x` is its center in field units (0..100). */
export interface Bottle {
  id: number;
  x: number;
  colorIndex: number;
  filled: boolean;
}

// --- Shared field geometry (field units: 0..100 both axes) ---
export const FIELD_WIDTH = 100;
export const DROP_X = 50; // straw hangs / drops here
export const STRAW_TOP_Y = 6; // straw's resting height
export const BOTTLE_MOUTH_Y = 68; // y where a falling straw meets a bottle
export const BOTTLE_WIDTH = 16; // body width; wide enough to hold the widest mouth
export const SPAWN_X = 108; // bottles appear just off the right edge
export const DESPAWN_X = -8; // and are removed just past the left edge
