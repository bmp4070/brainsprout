import type { Dir, PieceKind, Tri } from './types';
import { normalizeTris } from './tri';

export interface PaletteShape {
  tris: Tri[];
  kind: PieceKind;
}

/** The four atomic tris (N,E,S,W) of a whole cell. */
function cell(r: number, c: number): Tri[] {
  return ([0, 1, 2, 3] as Dir[]).map((d) => ({ r, c, d }));
}

/**
 * The tangram piece palette, in base (normalized) orientations. Triangles are
 * partial cells; squares and lines cover whole cells. The generator tiles a
 * backdrop from these; SQ_UNIT guarantees any whole-cell region is always
 * tileable, so every generated round is solvable.
 */
export const PALETTE: PaletteShape[] = [
  // Triangles (different sizes).
  { kind: 'triangle', tris: normalizeTris([{ r: 0, c: 0, d: 0 }]) }, // small: one quarter
  { kind: 'triangle', tris: normalizeTris([{ r: 0, c: 0, d: 0 }, { r: 0, c: 0, d: 1 }]) }, // half-cell (N+E)
  // Squares (different sizes).
  { kind: 'square', tris: normalizeTris(cell(0, 0)) }, // unit square
  { kind: 'square', tris: normalizeTris([...cell(0, 0), ...cell(0, 1), ...cell(1, 0), ...cell(1, 1)]) }, // 2x2
  // Lines (different sizes).
  { kind: 'line', tris: normalizeTris([...cell(0, 0), ...cell(0, 1)]) }, // 2-long bar
  { kind: 'line', tris: normalizeTris([...cell(0, 0), ...cell(0, 1), ...cell(0, 2)]) }, // 3-long bar
];
