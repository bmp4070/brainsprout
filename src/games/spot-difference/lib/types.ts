import type { ItemKind } from './items';

/**
 * A single placed element in a scene. `x`/`y` is the TOP-LEFT of the item's box
 * in scene units (0..100); the box dimensions come from the kind's ItemSpec
 * multiplied by `scale`.
 */
export interface SceneItem {
  id: string;
  kind: ItemKind;
  x: number;
  y: number;
  /** Multiplies the ItemSpec footprint. */
  scale: number;
  /** 0..6 into a theme palette (the UI maps to a hex per theme). */
  colorIndex: number;
  /** Horizontal mirror. */
  flipped: boolean;
}

export interface Scene {
  items: SceneItem[];
}

export type DiffKind = 'recolor' | 'remove' | 'add' | 'resize' | 'shift' | 'flip';

export interface Difference {
  id: string;
  kind: DiffKind;
  /** Circular hitbox in scene units — a tap within `radius` of (cx,cy) on EITHER image counts. */
  cx: number;
  cy: number;
  radius: number;
}

export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  itemCount: number;
  diffCount: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', itemCount: 10, diffCount: 4 },
  medium: { id: 'medium', label: 'Medium', emoji: '🐉', itemCount: 16, diffCount: 6 },
  hard: { id: 'hard', label: 'Hard', emoji: '🔥', itemCount: 22, diffCount: 8 },
};

export interface Puzzle {
  /** The base scene. */
  left: Scene;
  /** The base scene with the differences applied. */
  right: Scene;
  /** Exactly `diffCount` differences, with pairwise non-overlapping hitboxes. */
  differences: Difference[];
  themeId: string;
  seed: number;
}
