import type { Dir, Tri } from './types';
import { triKey } from './types';

/**
 * Pure geometry for atomic right-isosceles triangles on a square grid, where
 * each cell (r, c) is split by both diagonals into four quarter-triangles
 * d ∈ {0:N, 1:E, 2:S, 3:W} (see types.ts for the render geometry).
 *
 * The rotation/flip formulas below carry a direction-dependent ±1 cell offset
 * in principle, but because that offset is uniform across every tri of a
 * piece, `normalizeTris` (which subtracts the min row/col) absorbs it — so the
 * simple forms here are exact for whole pieces. The ground-truth polygon test
 * in tri.test.ts confirms this against the actual rotated geometry.
 */

/** N,E,S,W under a horizontal mirror: E↔W, N and S unchanged. */
const MIRROR_DIR: Record<Dir, Dir> = { 0: 0, 1: 3, 2: 2, 3: 1 };

function sortTris(tris: Tri[]): Tri[] {
  return [...tris].sort((a, b) => a.r - b.r || a.c - b.c || a.d - b.d);
}

/** Translate so min row and min col are both 0 (directions unchanged), sorted. */
export function normalizeTris(tris: Tri[]): Tri[] {
  if (tris.length === 0) return [];
  let minR = Infinity;
  let minC = Infinity;
  for (const t of tris) {
    if (t.r < minR) minR = t.r;
    if (t.c < minC) minC = t.c;
  }
  return sortTris(tris.map((t) => ({ r: t.r - minR, c: t.c - minC, d: t.d })));
}

/** Rotate 90° clockwise: (r, c, d) -> (c, -r, (d+1)%4), then normalize. */
export function rotate90(tris: Tri[]): Tri[] {
  return normalizeTris(tris.map((t) => ({ r: t.c, c: -t.r, d: ((t.d + 1) % 4) as Dir })));
}

/** Mirror across a vertical axis: (r, c, d) -> (r, -c, mirror(d)), then normalize. */
export function flipH(tris: Tri[]): Tri[] {
  return normalizeTris(tris.map((t) => ({ r: t.r, c: -t.c, d: MIRROR_DIR[t.d] })));
}

/** Canonical string of the normalized tris — order-independent shape identity. */
export function trisKey(tris: Tri[]): string {
  return normalizeTris(tris)
    .map(triKey)
    .join('|');
}

/**
 * All unique normalized orientations: 4 rotations of the shape and 4 of its
 * mirror, deduped by canonical key (≤ 8; fewer for symmetric shapes).
 */
export function orientations(tris: Tri[]): Tri[][] {
  const seen = new Set<string>();
  const result: Tri[][] = [];
  for (const base of [normalizeTris(tris), flipH(tris)]) {
    let current = base;
    for (let i = 0; i < 4; i += 1) {
      const key = trisKey(current);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(current);
      }
      current = rotate90(current);
    }
  }
  return result;
}

/**
 * Absolute atomic tris for an already-oriented, normalized shape placed with
 * its bounding-box top-left cell at (r, c). Since the shape's min row/col are
 * 0, this is a plain cell translation (directions unchanged).
 */
export function placeAt(orientedTris: Tri[], r: number, c: number): Tri[] {
  return orientedTris.map((t) => ({ r: t.r + r, c: t.c + c, d: t.d }));
}

/**
 * True iff every tri of `absTris` is part of `regionSet` (a Set of triKey) and
 * not already in `occupied` (also triKey strings).
 */
export function canPlace(
  regionSet: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  absTris: Tri[],
): boolean {
  for (const t of absTris) {
    const key = triKey(t);
    if (!regionSet.has(key)) return false;
    if (occupied.has(key)) return false;
  }
  return true;
}

/**
 * The three polygon corner points [x, y] of an atomic triangle, for rendering.
 * x is column-based, y is row-based; the apex is the cell center M.
 */
export function triPolygon(t: Tri): [number, number][] {
  const { r, c, d } = t;
  const TL: [number, number] = [c, r];
  const TR: [number, number] = [c + 1, r];
  const BR: [number, number] = [c + 1, r + 1];
  const BL: [number, number] = [c, r + 1];
  const M: [number, number] = [c + 0.5, r + 0.5];
  switch (d) {
    case 0:
      return [TL, TR, M];
    case 1:
      return [TR, BR, M];
    case 2:
      return [BR, BL, M];
    default:
      return [BL, TL, M];
  }
}
