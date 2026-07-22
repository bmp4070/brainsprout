import { describe, expect, it } from 'vitest';
import { generateLayout } from '../lib/layout';
import { optimalRoute } from '../lib/optimal';
import { DIFFICULTIES } from '../lib/types';
import type { DifficultyConfig, Layout } from '../lib/types';
import type { OptimalRoute } from '../lib/optimal';
import { initialState, reducer } from './useBusRoute';
import type { GameState } from './useBusRoute';

const DIFF: DifficultyConfig = DIFFICULTIES.easy;

function started(seed: number): {
  state: GameState;
  layout: Layout;
  optimal: OptimalRoute;
} {
  const layout = generateLayout(DIFF, seed);
  const optimal = optimalRoute(layout);
  const state = reducer(initialState, { type: 'START', difficulty: DIFF, layout, optimal });
  return { state, layout, optimal };
}

describe('reducer START / RESET', () => {
  it('START moves to planning with a fresh order and cleared result', () => {
    const { state } = started(1);
    expect(state.phase).toBe('planning');
    expect(state.difficulty).toBe(DIFF);
    expect(state.order).toEqual([]);
    expect(state.result).toBeNull();
    expect(state.optimal).not.toBeNull();
  });

  it('RESET returns to the initial picking state', () => {
    const { state } = started(1);
    const reset = reducer(state, { type: 'RESET' });
    expect(reset).toEqual(initialState);
    expect(reset.phase).toBe('picking');
  });
});

describe('reducer TAP_STOP', () => {
  it('appends valid stop ids in order', () => {
    const { state } = started(1);
    let s = reducer(state, { type: 'TAP_STOP', id: 2 });
    s = reducer(s, { type: 'TAP_STOP', id: 0 });
    expect(s.order).toEqual([2, 0]);
  });

  it('tapping the last stop again undoes it', () => {
    const { state } = started(1);
    let s = reducer(state, { type: 'TAP_STOP', id: 2 });
    s = reducer(s, { type: 'TAP_STOP', id: 0 });
    s = reducer(s, { type: 'TAP_STOP', id: 0 });
    expect(s.order).toEqual([2]);
  });

  it('tapping a stop already in the middle of the route is a no-op', () => {
    const { state } = started(1);
    let s = reducer(state, { type: 'TAP_STOP', id: 2 });
    s = reducer(s, { type: 'TAP_STOP', id: 0 });
    const before = s.order;
    s = reducer(s, { type: 'TAP_STOP', id: 2 });
    expect(s.order).toEqual(before);
  });

  it('ignores invalid stop ids', () => {
    const { state } = started(1);
    const s = reducer(state, { type: 'TAP_STOP', id: 999 });
    expect(s.order).toEqual([]);
    expect(s).toBe(state);
  });

  it('ignores taps outside the planning phase', () => {
    const s = reducer(initialState, { type: 'TAP_STOP', id: 0 });
    expect(s).toBe(initialState);
  });
});

describe('reducer CLEAR', () => {
  it('empties the order during planning', () => {
    const { state } = started(1);
    let s = reducer(state, { type: 'TAP_STOP', id: 1 });
    s = reducer(s, { type: 'TAP_STOP', id: 3 });
    s = reducer(s, { type: 'CLEAR' });
    expect(s.order).toEqual([]);
  });
});

describe('reducer GO gating', () => {
  it('is rejected until every stop is picked', () => {
    const { state } = started(1);
    let s = reducer(state, { type: 'TAP_STOP', id: 0 });
    s = reducer(s, { type: 'GO' });
    expect(s.phase).toBe('planning');
  });

  it('advances to driving once the order is complete', () => {
    const { state } = started(1);
    let s = state;
    for (let id = 0; id < DIFF.stopCount; id++) {
      s = reducer(s, { type: 'TAP_STOP', id });
    }
    s = reducer(s, { type: 'GO' });
    expect(s.phase).toBe('driving');
  });
});

describe('reducer ARRIVED', () => {
  it('only fires while driving', () => {
    const { state } = started(1);
    const s = reducer(state, { type: 'ARRIVED' });
    expect(s).toBe(state);
  });

  it('happy path: tapping the optimal order yields 3 stars and score 1000', () => {
    const { state, optimal } = started(4);
    let s = state;
    for (const id of optimal.order) {
      s = reducer(s, { type: 'TAP_STOP', id });
    }
    expect(s.order).toEqual(optimal.order);
    s = reducer(s, { type: 'GO' });
    expect(s.phase).toBe('driving');
    s = reducer(s, { type: 'ARRIVED' });
    expect(s.phase).toBe('done');
    expect(s.result).not.toBeNull();
    expect(s.result?.stars).toBe(3);
    expect(s.result?.score).toBe(1000);
    expect(s.result?.ratio).toBeCloseTo(1, 9);
  });

  it('a suboptimal order still completes with a valid result', () => {
    const { state } = started(4);
    let s = state;
    // Reverse pickup order (still a full permutation).
    for (let id = DIFF.stopCount - 1; id >= 0; id--) {
      s = reducer(s, { type: 'TAP_STOP', id });
    }
    s = reducer(s, { type: 'GO' });
    s = reducer(s, { type: 'ARRIVED' });
    expect(s.phase).toBe('done');
    expect(s.result).not.toBeNull();
    expect([1, 2, 3]).toContain(s.result?.stars);
    expect(s.result?.score).toBeGreaterThanOrEqual(300);
    expect(s.result?.score).toBeLessThanOrEqual(1000);
  });
});
