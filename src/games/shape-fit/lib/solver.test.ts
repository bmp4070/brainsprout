import { describe, expect, it } from 'vitest';
import { hintPlacement, isCompletable, solveRemaining } from './solver';
import { triKey } from './types';
import type { Piece, Tri } from './types';

const N: Tri = { r: 0, c: 0, d: 0 };
const E: Tri = { r: 0, c: 0, d: 1 };
const S: Tri = { r: 0, c: 0, d: 2 };
const W: Tri = { r: 0, c: 0, d: 3 };

function piece(id: number, tris: Tri[], kind: Piece['kind']): Piece {
  return { id, tris, colorIndex: id % 7, kind };
}

const SQUARE = (id: number) => piece(id, [N, E, S, W], 'square');
const HALF = (id: number) => piece(id, [N, E], 'triangle');

/** Region = the four tris of a single cell (0,0). */
const ONE_CELL = new Set([N, E, S, W].map(triKey));

function coveredKeys(placements: { tris: Tri[] }[]): Set<string> {
  const set = new Set<string>();
  for (const p of placements) for (const t of p.tris) set.add(triKey(t));
  return set;
}

describe('solveRemaining', () => {
  it('fills a cell with one unit-square piece', () => {
    const res = solveRemaining(ONE_CELL, new Set(), [SQUARE(0)]);
    expect(res.exact).toBe(true);
    expect(res.solution).not.toBeNull();
    expect(res.solution).toHaveLength(1);
    expect(coveredKeys(res.solution!).size).toBe(4);
  });

  it('fills a cell with two half-triangle pieces', () => {
    const res = solveRemaining(ONE_CELL, new Set(), [HALF(0), HALF(1)]);
    expect(res.exact).toBe(true);
    expect(res.solution).not.toBeNull();
    expect(coveredKeys(res.solution!).size).toBe(4);
    expect(res.solution!.map((p) => p.pieceId).sort()).toEqual([0, 1]);
  });

  it('returns null (exact) when the pieces cannot cover the region', () => {
    const res = solveRemaining(ONE_CELL, new Set(), [HALF(0)]); // 2 tris < 4
    expect(res.exact).toBe(true);
    expect(res.solution).toBeNull();
  });

  it('respects already-occupied tris', () => {
    const occupied = new Set([N, E].map(triKey)); // upper-right half filled
    const res = solveRemaining(ONE_CELL, occupied, [HALF(0)]);
    expect(res.exact).toBe(true);
    expect(res.solution).not.toBeNull();
    expect(coveredKeys(res.solution!).size).toBe(2);
  });

  it('reports exact=false when the node budget is exhausted', () => {
    const res = solveRemaining(ONE_CELL, new Set(), [SQUARE(0)], 0);
    expect(res.exact).toBe(false);
    expect(res.solution).toBeNull();
  });
});

describe('hintPlacement', () => {
  it('returns a placement covering the lowest uncovered tri', () => {
    const p = hintPlacement(ONE_CELL, new Set(), [HALF(0), HALF(1)]);
    expect(p).not.toBeNull();
    expect(p!.tris.some((t) => triKey(t) === triKey(N))).toBe(true);
  });

  it('returns null when no completion exists', () => {
    expect(hintPlacement(ONE_CELL, new Set(), [HALF(0)])).toBeNull();
  });
});

describe('isCompletable', () => {
  it('is true when the pieces can tile the region', () => {
    expect(isCompletable(ONE_CELL, new Set(), [HALF(0), HALF(1)])).toBe(true);
  });
  it('is false when they provably cannot', () => {
    expect(isCompletable(ONE_CELL, new Set(), [HALF(0)])).toBe(false);
  });
  it('is conservatively true when the budget is exhausted', () => {
    expect(isCompletable(ONE_CELL, new Set(), [HALF(0)], 0)).toBe(true);
  });
});
