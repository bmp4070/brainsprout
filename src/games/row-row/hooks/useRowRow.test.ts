import { describe, expect, it } from 'vitest';
import { initialState, reducer, segmentAt, segmentIndexAt } from './useRowRow';
import type { GameState } from './useRowRow';
import type { Segment } from '../lib/pattern';
import { DIFFICULTIES } from '../lib/types';

const pattern: Segment[] = [
  { type: 'rest', durationMs: 100 }, // 0-100
  { type: 'row', durationMs: 200 }, // 100-300
  { type: 'rest', durationMs: 150 }, // 300-450
];
const loopMs = 450;

describe('segmentAt', () => {
  it('finds the segment containing a given elapsed time within one loop', () => {
    expect(segmentAt(pattern, loopMs, 0)).toBe(pattern[0]);
    expect(segmentAt(pattern, loopMs, 99)).toBe(pattern[0]);
    expect(segmentAt(pattern, loopMs, 100)).toBe(pattern[1]);
    expect(segmentAt(pattern, loopMs, 299)).toBe(pattern[1]);
    expect(segmentAt(pattern, loopMs, 300)).toBe(pattern[2]);
    expect(segmentAt(pattern, loopMs, 449)).toBe(pattern[2]);
  });

  it('wraps around the loop boundary via modulo', () => {
    expect(segmentAt(pattern, loopMs, 450)).toBe(pattern[0]);
    expect(segmentAt(pattern, loopMs, 451)).toBe(pattern[0]);
    expect(segmentAt(pattern, loopMs, 450 + 100)).toBe(pattern[1]);
    expect(segmentAt(pattern, loopMs, 450 * 3 + 300)).toBe(pattern[2]);
  });

  it('falls back to the first segment when patternLoopMs is 0', () => {
    expect(segmentAt(pattern, 0, 12345)).toBe(pattern[0]);
  });
});

describe('segmentIndexAt', () => {
  it('returns the index matching segmentAt across the loop boundary', () => {
    for (const elapsed of [0, 99, 100, 299, 300, 449, 450, 451, 900 + 300]) {
      expect(pattern[segmentIndexAt(pattern, loopMs, elapsed)]).toBe(segmentAt(pattern, loopMs, elapsed));
    }
  });
});

function playing(overrides: Partial<GameState> = {}): GameState {
  return {
    ...initialState,
    phase: 'playing',
    difficulty: DIFFICULTIES.easy,
    pattern,
    patternLoopMs: loopMs,
    ...overrides,
  };
}

describe('reducer', () => {
  it('START builds a fresh playing state with a generated pattern', () => {
    const state = reducer(initialState, { type: 'START', difficulty: DIFFICULTIES.easy, seed: 1 });
    expect(state.phase).toBe('playing');
    expect(state.difficulty).toBe(DIFFICULTIES.easy);
    expect(state.pattern).not.toBeNull();
    expect(state.patternLoopMs).toBeGreaterThan(0);
    expect(state.position).toBe(0);
    expect(state.elapsedMs).toBe(0);
    expect(state.rowing).toBe(false);
  });

  it('ROW_START/ROW_END toggle rowing while playing', () => {
    let state = playing();
    state = reducer(state, { type: 'ROW_START' });
    expect(state.rowing).toBe(true);
    state = reducer(state, { type: 'ROW_END' });
    expect(state.rowing).toBe(false);
  });

  it('ROW_START/ROW_END are no-ops outside the playing phase', () => {
    expect(reducer(initialState, { type: 'ROW_START' })).toBe(initialState);
    expect(reducer(initialState, { type: 'ROW_END' })).toBe(initialState);
  });

  it('TICK advances position only when rowing during a row segment', () => {
    // elapsed 0->50 lands in the lead-in rest segment (0-100ms); rowing here
    // should count as wrong, not advance position.
    let state = playing({ rowing: true });
    state = reducer(state, { type: 'TICK', deltaMs: 50 });
    expect(state.position).toBe(0);
    expect(state.wrongMs).toBe(50);
    expect(state.correctMs).toBe(0);

    // Advance elapsed into the row segment (100-300ms) and tick again.
    state = reducer(state, { type: 'TICK', deltaMs: 60 }); // elapsed 110, in row segment
    expect(state.position).toBeGreaterThan(0);
    expect(state.correctMs).toBe(60);
  });

  it('TICK does not advance position when not rowing during a row segment (missed)', () => {
    let state = playing({ elapsedMs: 100, rowing: false });
    state = reducer(state, { type: 'TICK', deltaMs: 50 }); // elapsed 150, in row segment
    expect(state.position).toBe(0);
    expect(state.missedMs).toBe(50);
  });

  it('TICK applies a backslide when rowing during a rest segment', () => {
    let state = playing({ elapsedMs: 0, position: 100, rowing: true });
    // Move elapsed into the second rest segment (300-450ms).
    state = reducer(state, { type: 'TICK', deltaMs: 350 }); // elapsed 350
    expect(state.position).toBeLessThan(100);
    expect(state.wrongMs).toBeGreaterThan(0);
  });

  it('backslide never takes position below 0', () => {
    let state = playing({ elapsedMs: 0, position: 1, rowing: true });
    state = reducer(state, { type: 'TICK', deltaMs: 350 }); // lands in rest segment
    expect(state.position).toBe(0);
  });

  it('transitions to won when position reaches totalDistance, clamped', () => {
    const difficulty = { ...DIFFICULTIES.easy, totalDistance: 100 };
    let state = playing({ difficulty, position: 90, rowing: true, elapsedMs: 100 });
    // elapsed 100 -> in row segment (100-300ms); ticking 50ms rowing adds 50.
    state = reducer(state, { type: 'TICK', deltaMs: 50 });
    expect(state.phase).toBe('won');
    expect(state.position).toBe(100); // clamped to totalDistance
    expect(state.score).toBeGreaterThanOrEqual(0);
  });

  it('TICK is a no-op once the game has already been won', () => {
    const difficulty = { ...DIFFICULTIES.easy, totalDistance: 100 };
    const won = reducer(playing({ difficulty, position: 100, rowing: true }), {
      type: 'TICK',
      deltaMs: 0,
    });
    const wonState = { ...won, phase: 'won' as const };
    const after = reducer(wonState, { type: 'TICK', deltaMs: 500 });
    expect(after).toBe(wonState);
  });

  it('RESET returns to the initial picking state', () => {
    const state = reducer(playing({ position: 50 }), { type: 'RESET' });
    expect(state).toEqual(initialState);
  });
});
