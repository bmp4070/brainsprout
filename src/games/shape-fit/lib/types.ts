/**
 * Triangle-tangram geometry model.
 *
 * A puzzle lives on an R×C square grid of cells. Each cell (r, c) is split by
 * BOTH diagonals into four atomic right-isosceles triangles, identified by a
 * direction d ∈ {0:N, 1:E, 2:S, 3:W}. An atomic triangle is `Tri = {r, c, d}`.
 *
 * Render geometry — cell (r, c) is the unit square with corners
 *   TL = (c, r), TR = (c+1, r), BR = (c+1, r+1), BL = (c, r+1),
 *   M  = (c+0.5, r+0.5);  x = column, y = row:
 *   d=0 (N): TL, TR, M   d=1 (E): TR, BR, M
 *   d=2 (S): BR, BL, M   d=3 (W): BL, TL, M
 */

/** Atomic-triangle direction: 0:N, 1:E, 2:S, 3:W. */
export type Dir = 0 | 1 | 2 | 3;

/** A single atomic right-isosceles triangle at cell (r, c), quarter `d`. */
export interface Tri {
  r: number;
  c: number;
  d: Dir;
}

/** The family a piece belongs to (drives its color / label in the UI). */
export type PieceKind = 'triangle' | 'square' | 'line';

export type DifficultyId = 'easy' | 'medium' | 'hard';

/** Which backdrop silhouette a round uses (alternates each round). */
export type Backdrop = 'diamond' | 'rhombus';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** Backdrop radius/extent — see generator for how each backdrop uses it. */
  size: number;
  /** Upper bound on the number of tray pieces a generated puzzle may have. */
  maxPieces: number;
}

/**
 * Difficulty tuning. `size` is the diamond radius (Manhattan ball) and drives
 * the rhombus dimensions too; cell counts land in the intended ranges:
 *   easy   diamond radius 1 → 5 cells,  rhombus 2×3 → 6 cells
 *   medium diamond radius 2 → 13 cells, rhombus 3×4 → 12 cells
 *   hard   diamond radius 3 → 25 cells, rhombus 4×5 → 20 cells
 * `maxPieces` is ≥ the largest cell count so the all-unit-square tiling always
 * fits within the contract, guaranteeing every round is solvable.
 */
export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: { id: 'easy', label: 'Easy', emoji: '🐣', size: 1, maxPieces: 8 },
  medium: { id: 'medium', label: 'Medium', emoji: '🐉', size: 2, maxPieces: 14 },
  hard: { id: 'hard', label: 'Hard', emoji: '🔥', size: 3, maxPieces: 26 },
};

/**
 * A tray piece. `tris` is the piece's BASE shape, normalized (min r = 0,
 * min c = 0, sorted by (r, c, d)). colorIndex is 0..6.
 */
export interface Piece {
  id: number;
  tris: Tri[];
  colorIndex: number;
  kind: PieceKind;
}

/** One piece placed at absolute atomic tris (generator solution + hints). */
export interface Placement {
  pieceId: number;
  tris: Tri[];
}

export interface Puzzle {
  rows: number;
  cols: number;
  backdrop: Backdrop;
  /** Every atomic tri that must be covered (all 4 dirs of each backdrop cell). */
  region: Tri[];
  pieces: Piece[];
  /** One valid full tiling (pieceId ↔ pieces[].id). */
  solution: Placement[];
  seed: number;
}

/** Stable string key for an atomic triangle: `${r},${c},${d}`. */
export function triKey(t: Tri): string {
  return `${t.r},${t.c},${t.d}`;
}
