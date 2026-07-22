import { cellKey } from './types';
import type { CellMark, CellPos } from './types';

/** Chebyshev-adjacent (8-neighbour): the two cells touch, including diagonally. */
function touches(a: CellPos, b: CellPos): boolean {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

/**
 * Pure: returns cellKeys of every cat that violates a rule -- sharing a row,
 * a column, an 8-neighbour adjacency, or a colored region with another cat.
 * Both cats of an offending pair are flagged. Paw marks are ignored entirely.
 */
export function findConflicts(marks: CellMark[][], regions: number[][]): Set<string> {
  const cats: CellPos[] = [];
  for (let row = 0; row < marks.length; row++) {
    for (let col = 0; col < marks[row].length; col++) {
      if (marks[row][col] === 'cat') cats.push({ row, col });
    }
  }

  const conflicts = new Set<string>();
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const a = cats[i];
      const b = cats[j];
      const sameRow = a.row === b.row;
      const sameCol = a.col === b.col;
      const sameRegion = regions[a.row][a.col] === regions[b.row][b.col];
      if (sameRow || sameCol || sameRegion || touches(a, b)) {
        conflicts.add(cellKey(a));
        conflicts.add(cellKey(b));
      }
    }
  }
  return conflicts;
}

/** Counts how many cats currently sit in each region index 0..size-1. */
export function regionCatCounts(
  marks: CellMark[][],
  regions: number[][],
  size: number,
): number[] {
  const counts = new Array<number>(size).fill(0);
  for (let row = 0; row < marks.length; row++) {
    for (let col = 0; col < marks[row].length; col++) {
      if (marks[row][col] === 'cat') counts[regions[row][col]] += 1;
    }
  }
  return counts;
}
