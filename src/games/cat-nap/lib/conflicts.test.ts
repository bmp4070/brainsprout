import { describe, expect, it } from 'vitest';
import { findConflicts, regionCatCounts } from './conflicts';
import type { CellMark } from './types';

/** Builds a marks grid from a compact string map: '.' empty, 'C' cat, 'P' paw. */
function grid(rows: string[]): CellMark[][] {
  return rows.map((r) =>
    [...r].map((ch): CellMark => (ch === 'C' ? 'cat' : ch === 'P' ? 'paw' : 'empty')),
  );
}

/** Each cell its own region, so region-sharing never triggers here. */
function distinctRegions(size: number): number[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => row * size + col),
  );
}

describe('cat-nap conflicts', () => {
  it('flags both cats sharing a row', () => {
    const marks = grid(['C..C', '....', '....', '....']);
    const conflicts = findConflicts(marks, distinctRegions(4));
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('0,3')).toBe(true);
    expect(conflicts.size).toBe(2);
  });

  it('flags both cats sharing a column', () => {
    const marks = grid(['C...', '....', '....', 'C...']);
    const conflicts = findConflicts(marks, distinctRegions(4));
    expect(conflicts).toEqual(new Set(['0,0', '3,0']));
  });

  it('flags a diagonally touching pair', () => {
    const marks = grid(['C...', '.C..', '....', '....']);
    const conflicts = findConflicts(marks, distinctRegions(4));
    expect(conflicts).toEqual(new Set(['0,0', '1,1']));
  });

  it('flags an orthogonally touching pair', () => {
    const marks = grid(['.C..', '.C..', '....', '....']);
    const conflicts = findConflicts(marks, distinctRegions(4));
    // same column AND adjacent -- still just the two cats.
    expect(conflicts).toEqual(new Set(['0,1', '1,1']));
  });

  it('flags two cats sharing a region even when far apart', () => {
    const regions = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [2, 2, 2, 2],
      [3, 3, 3, 3],
    ];
    const marks = grid(['C..C', '....', '....', '....']);
    // row 0 is one region; both cats share it (and the row).
    const conflicts = findConflicts(marks, regions);
    expect(conflicts).toEqual(new Set(['0,0', '0,3']));
  });

  it('flags region-sharing that is not otherwise a violation', () => {
    // Region 0 snakes through (0,0),(0,1),(1,1),(2,1),(2,2).
    const regions = [
      [0, 0, 5, 5],
      [6, 0, 7, 7],
      [6, 0, 0, 8],
      [9, 9, 9, 8],
    ];
    // Cats at (0,0) and (2,2): distinct rows, distinct cols, Chebyshev 2 (not
    // touching). The only violation is that they share region 0.
    const marks = grid(['C...', '....', '..C.', '....']);
    const conflicts = findConflicts(marks, regions);
    expect(conflicts).toEqual(new Set(['0,0', '2,2']));
  });

  it('does not flag an isolated valid cat', () => {
    const marks = grid(['C...', '....', '..C.', '....']);
    const conflicts = findConflicts(marks, distinctRegions(4));
    expect(conflicts.size).toBe(0);
  });

  it('never flags paw marks', () => {
    const marks = grid(['PP..', 'PP..', '....', '....']);
    const conflicts = findConflicts(marks, distinctRegions(4));
    expect(conflicts.size).toBe(0);
  });

  it('counts cats per region', () => {
    const regions = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];
    const marks = grid(['C..C', '....', '..C.', '....']);
    expect(regionCatCounts(marks, regions, 4)).toEqual([1, 1, 0, 1]);
  });
});
