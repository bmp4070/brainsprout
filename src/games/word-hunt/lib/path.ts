import type { Cell } from './types';

/** True iff two cells are the same square. */
export function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

/** True iff `a` and `b` are distinct and touch (8-way, incl. diagonals). */
export function adjacent(a: Cell, b: Cell): boolean {
  if (sameCell(a, b)) return false;
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;
}

/** True iff `cell` is inside a `size x size` board. */
export function inBounds(cell: Cell, size: number): boolean {
  return cell.row >= 0 && cell.row < size && cell.col >= 0 && cell.col < size;
}

/**
 * True iff `path` is a legal Boggle trace: every cell in bounds, each step
 * adjacent to the previous, and no cell visited twice. An empty or single-cell
 * path is trivially valid.
 */
export function isValidPath(path: Cell[], size: number): boolean {
  const seen = new Set<string>();
  for (let i = 0; i < path.length; i += 1) {
    const cell = path[i];
    if (!inBounds(cell, size)) return false;
    const key = `${cell.row},${cell.col}`;
    if (seen.has(key)) return false;
    seen.add(key);
    if (i > 0 && !adjacent(path[i - 1], cell)) return false;
  }
  return true;
}

/** The word spelled by tracing `path` across `grid`, lowercased. */
export function pathWord(path: Cell[], grid: string[][]): string {
  return path.map((cell) => grid[cell.row][cell.col]).join('').toLowerCase();
}

/** Compact string key for a full path, used to dedupe found traces. */
export function pathKey(path: Cell[]): string {
  return path.map((cell) => `${cell.row},${cell.col}`).join('-');
}
