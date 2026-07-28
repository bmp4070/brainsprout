import type { Cell } from './types';

/** Sorts cells by (r, c) ascending, returning a new array. */
function sortCells(cells: Cell[]): Cell[] {
  return [...cells].sort((a, b) => (a.r - b.r) || (a.c - b.c));
}

/** Translate a set of cells so its min row and min col are both 0, then sort. */
export function normalize(cells: Cell[]): Cell[] {
  if (cells.length === 0) return [];
  let minR = Infinity;
  let minC = Infinity;
  for (const cell of cells) {
    if (cell.r < minR) minR = cell.r;
    if (cell.c < minC) minC = cell.c;
  }
  return sortCells(cells.map((cell) => ({ r: cell.r - minR, c: cell.c - minC })));
}

/** Rotate 90° clockwise: (r, c) -> (c, -r), then normalize. */
export function rotate90(cells: Cell[]): Cell[] {
  return normalize(cells.map((cell) => ({ r: cell.c, c: -cell.r })));
}

/** Mirror horizontally: (r, c) -> (r, -c), then normalize. */
export function flipH(cells: Cell[]): Cell[] {
  return normalize(cells.map((cell) => ({ r: cell.r, c: -cell.c })));
}

/** Canonical string of the NORMALIZED cells (order-independent shape identity). */
export function cellsKey(cells: Cell[]): string {
  return normalize(cells)
    .map((cell) => `${cell.r},${cell.c}`)
    .join('|');
}

/**
 * All UNIQUE normalized orientations of a shape: the 4 rotations of the shape
 * and the 4 rotations of its mirror, deduped by canonical key (≤ 8, but fewer
 * for symmetric shapes: square = 1, domino = 2, S-tetromino = 2, etc.).
 */
export function orientations(cells: Cell[]): Cell[][] {
  const seen = new Set<string>();
  const result: Cell[][] = [];
  for (const base of [normalize(cells), flipH(cells)]) {
    let current = base;
    for (let i = 0; i < 4; i += 1) {
      const key = cellsKey(current);
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
 * Absolute cells for an already-oriented, normalized shape placed with its
 * bounding-box top-left at (r, c). Since the shape's min row/col are 0, this is
 * a simple translation.
 */
export function placeAt(orientedCells: Cell[], r: number, c: number): Cell[] {
  return orientedCells.map((cell) => ({ r: cell.r + r, c: cell.c + c }));
}

/**
 * True iff every cell of `absCells` lies inside `region` (in bounds and true)
 * AND is not already in `occupied` (a Set of cellKey strings).
 */
export function canPlace(
  region: boolean[][],
  occupied: ReadonlySet<string>,
  absCells: Cell[],
): boolean {
  const rows = region.length;
  const cols = rows > 0 ? region[0].length : 0;
  for (const cell of absCells) {
    if (cell.r < 0 || cell.r >= rows || cell.c < 0 || cell.c >= cols) return false;
    if (!region[cell.r][cell.c]) return false;
    if (occupied.has(`${cell.r},${cell.c}`)) return false;
  }
  return true;
}
