import { describe, expect, it } from 'vitest';
import { routeLength } from './geometry';
import { generateLayout } from './layout';
import { optimalRoute } from './optimal';
import { DIFFICULTIES } from './types';
import type { Layout } from './types';

/**
 * Independent brute-force reference: enumerates ALL permutations (no
 * direction-halving) and returns the minimum closed-tour length. Deliberately
 * simple so it cross-checks the production solver's cleverness.
 */
function referenceOptimalLength(layout: Layout): number {
  const ids = layout.stops.map((s) => s.id);
  let best = Infinity;

  const permute = (arr: number[], k: number): void => {
    if (k === arr.length) {
      const len = routeLength(layout.school, layout.stops, arr, true);
      if (len < best) best = len;
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i], arr[k]];
      permute(arr, k + 1);
      [arr[k], arr[i]] = [arr[i], arr[k]];
    }
  };

  if (ids.length === 0) return 0;
  permute(ids, 0);
  return best;
}

describe('optimalRoute', () => {
  it('matches an independent full enumeration for 5 stops across 30 seeds', () => {
    for (let seed = 0; seed < 30; seed++) {
      const layout = generateLayout(DIFFICULTIES.easy, seed);
      const opt = optimalRoute(layout);
      const reference = referenceOptimalLength(layout);
      expect(opt.length).toBeCloseTo(reference, 9);
    }
  });

  it('returned order actually has the reported length', () => {
    for (let seed = 0; seed < 30; seed++) {
      const layout = generateLayout(DIFFICULTIES.easy, seed);
      const opt = optimalRoute(layout);
      const measured = routeLength(layout.school, layout.stops, opt.order, true);
      expect(measured).toBeCloseTo(opt.length, 9);
      // Order is a permutation of all stop ids.
      expect([...opt.order].sort((a, b) => a - b)).toEqual(
        layout.stops.map((s) => s.id).sort((a, b) => a - b),
      );
    }
  });

  it('direction-halving still finds the true optimum for 7 stops', () => {
    for (const seed of [3, 11, 42, 99]) {
      const layout = generateLayout(DIFFICULTIES.medium, seed);
      const opt = optimalRoute(layout);
      const reference = referenceOptimalLength(layout);
      expect(opt.length).toBeCloseTo(reference, 9);
    }
  });
});
