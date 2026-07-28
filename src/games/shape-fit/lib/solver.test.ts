import { describe, expect, it } from 'vitest';
import { hintPlacement, isCompletable, solveRemaining } from './solver';
import { cellKey } from './types';
import type { Cell, Piece } from './types';

function fullRegion(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => true));
}

const O_PIECE: Piece = {
  id: 0,
  cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
  colorIndex: 0,
};
const L_TROMINO: Piece = {
  id: 1,
  cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }],
  colorIndex: 1,
};
const DOMINO: Piece = {
  id: 2,
  cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }],
  colorIndex: 2,
};
const L_TETROMINO: Piece = {
  id: 3,
  cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }],
  colorIndex: 3,
};

function coversExactly(placements: { cells: Cell[] }[], expected: number): boolean {
  const seen = new Set<string>();
  for (const p of placements) {
    for (const cell of p.cells) {
      const key = cellKey(cell);
      if (seen.has(key)) return false;
      seen.add(key);
    }
  }
  return seen.size === expected;
}

describe('solveRemaining', () => {
  it('finds the unique tiling of a 2x2 region with one square piece', () => {
    const result = solveRemaining(fullRegion(2, 2), new Set(), [O_PIECE]);
    expect(result.exact).toBe(true);
    expect(result.solution).not.toBeNull();
    expect(result.solution).toHaveLength(1);
    expect(result.solution![0].pieceId).toBe(0);
    expect(coversExactly(result.solution!, 4)).toBe(true);
  });

  it('tiles a 2x3 region with a domino and an L-tetromino, covering it exactly', () => {
    // 2 + 4 = 6 cells exactly fills the 2x3 region.
    const result = solveRemaining(fullRegion(2, 3), new Set(), [DOMINO, L_TETROMINO]);
    expect(result.exact).toBe(true);
    expect(result.solution).not.toBeNull();
    expect(coversExactly(result.solution!, 6)).toBe(true);
    const ids = result.solution!.map((p) => p.pieceId).sort();
    expect(ids).toEqual([2, 3]);
  });

  it('returns null (exact) when a piece cannot fit the shape (1x3 line, L-tromino)', () => {
    const region = fullRegion(1, 3);
    const result = solveRemaining(region, new Set(), [L_TROMINO]);
    expect(result.exact).toBe(true);
    expect(result.solution).toBeNull();
  });

  it('returns null (exact) on a cell-count parity mismatch', () => {
    const result = solveRemaining(fullRegion(2, 2), new Set(), [L_TROMINO]);
    expect(result.exact).toBe(true);
    expect(result.solution).toBeNull();
  });

  it('respects already-occupied cells', () => {
    // 2x2 with (0,0) occupied leaves an L-tromino of empty cells.
    const occupied = new Set<string>(['0,0']);
    const result = solveRemaining(fullRegion(2, 2), occupied, [L_TROMINO]);
    expect(result.exact).toBe(true);
    expect(result.solution).not.toBeNull();
    expect(coversExactly(result.solution!, 3)).toBe(true);
  });

  it('reports exact=false gracefully when the node budget is exhausted', () => {
    const result = solveRemaining(fullRegion(2, 2), new Set(), [O_PIECE], 0);
    expect(result.exact).toBe(false);
    expect(result.solution).toBeNull();
  });
});

describe('hintPlacement', () => {
  it('returns a placement covering the lowest uncovered cell that completes', () => {
    const placement = hintPlacement(fullRegion(2, 2), new Set(), [O_PIECE]);
    expect(placement).not.toBeNull();
    const keys = placement!.cells.map(cellKey);
    expect(keys).toContain('0,0');
    expect(placement!.pieceId).toBe(0);
  });

  it('returns null when no completion exists', () => {
    expect(hintPlacement(fullRegion(1, 3), new Set(), [L_TROMINO])).toBeNull();
  });
});

describe('isCompletable', () => {
  it('is true when the remaining pieces can tile the region', () => {
    expect(isCompletable(fullRegion(2, 3), new Set(), [DOMINO, L_TETROMINO])).toBe(true);
  });

  it('is false when they provably cannot', () => {
    expect(isCompletable(fullRegion(1, 3), new Set(), [L_TROMINO])).toBe(false);
  });

  it('is conservatively true when the budget is exhausted', () => {
    expect(isCompletable(fullRegion(1, 3), new Set(), [L_TROMINO], 0)).toBe(true);
  });
});
