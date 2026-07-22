import { describe, expect, it } from 'vitest';
import { dist, lPath, manhattanDist, routeLength } from './geometry';
import type { Point, Stop } from './types';

describe('dist', () => {
  it('computes Euclidean distance', () => {
    expect(dist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('is zero for identical points', () => {
    expect(dist({ x: 7, y: 2 }, { x: 7, y: 2 })).toBe(0);
  });

  it('is symmetric', () => {
    const a: Point = { x: 1, y: 9 };
    const b: Point = { x: 4, y: 5 };
    expect(dist(a, b)).toBe(dist(b, a));
  });
});

describe('manhattanDist', () => {
  it('sums the axis deltas', () => {
    expect(manhattanDist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it('differs from Euclidean distance on a diagonal', () => {
    const a: Point = { x: 0, y: 0 };
    const b: Point = { x: 3, y: 4 };
    expect(manhattanDist(a, b)).toBeGreaterThan(dist(a, b));
  });

  it('equals Euclidean distance on an axis-aligned leg', () => {
    const a: Point = { x: 10, y: 20 };
    const b: Point = { x: 10, y: 50 };
    expect(manhattanDist(a, b)).toBe(dist(a, b));
  });

  it('is zero for identical points', () => {
    expect(manhattanDist({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
  });

  it('is symmetric', () => {
    const a: Point = { x: 1, y: 9 };
    const b: Point = { x: 4, y: 5 };
    expect(manhattanDist(a, b)).toBe(manhattanDist(b, a));
  });
});

describe('lPath', () => {
  it('returns a single point when a and b are identical', () => {
    const a: Point = { x: 5, y: 5 };
    expect(lPath(a, { x: 5, y: 5 })).toEqual([a]);
  });

  it('returns a direct two-point segment when a and b share an x coordinate', () => {
    const a: Point = { x: 10, y: 20 };
    const b: Point = { x: 10, y: 50 };
    expect(lPath(a, b)).toEqual([a, b]);
  });

  it('returns a direct two-point segment when a and b share a y coordinate', () => {
    const a: Point = { x: 10, y: 20 };
    const b: Point = { x: 40, y: 20 };
    expect(lPath(a, b)).toEqual([a, b]);
  });

  it('bends horizontal-first for a diagonal pair', () => {
    const a: Point = { x: 10, y: 20 };
    const b: Point = { x: 40, y: 50 };
    expect(lPath(a, b)).toEqual([a, { x: 40, y: 20 }, b]);
  });

  it('total length of the bend equals the Manhattan distance', () => {
    const a: Point = { x: 10, y: 20 };
    const b: Point = { x: 40, y: 50 };
    const path = lPath(a, b);
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) total += dist(path[i], path[i + 1]);
    expect(total).toBeCloseTo(manhattanDist(a, b), 9);
  });
});

describe('routeLength', () => {
  const school: Point = { x: 0, y: 0 };
  const stops: Stop[] = [
    { id: 0, x: 0, y: 3 },
    { id: 1, x: 4, y: 3 },
    { id: 2, x: 4, y: 0 },
  ];

  it('returns 0 for an empty order (open)', () => {
    expect(routeLength(school, stops, [], false)).toBe(0);
  });

  it('returns 0 for an empty order (closed, school -> school)', () => {
    expect(routeLength(school, stops, [], true)).toBe(0);
  });

  it('open path omits the closing leg', () => {
    // school(0,0) -> (0,3): length 3
    expect(routeLength(school, stops, [0], false)).toBe(3);
  });

  it('closed path adds the return leg', () => {
    // school(0,0) -> (0,3) -> back: 3 + 3 = 6
    expect(routeLength(school, stops, [0], true)).toBe(6);
  });

  it('full closed tour equals the sum of legs (hand-computed)', () => {
    // 0,0 -> 0,3 (3) -> 4,3 (4) -> 4,0 (3) -> 0,0 (4) = 14
    expect(routeLength(school, stops, [0, 1, 2], true)).toBe(14);
  });

  it('open full order omits the closing leg', () => {
    // 0,0 -> 0,3 (3) -> 4,3 (4) -> 4,0 (3) = 10
    expect(routeLength(school, stops, [0, 1, 2], false)).toBe(10);
  });

  it('skips ids not present in stops', () => {
    // unknown id 99 is ignored; behaves like [0]
    expect(routeLength(school, stops, [0, 99], true)).toBe(6);
  });

  it('uses Manhattan distance for a diagonal leg (differs from Euclidean)', () => {
    const diagStops: Stop[] = [{ id: 0, x: 3, y: 4 }];
    // Manhattan: 3 + 4 = 7, not the Euclidean 5.
    expect(routeLength(school, diagStops, [0], false)).toBe(7);
  });
});
