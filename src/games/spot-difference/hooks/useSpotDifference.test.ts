import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './useSpotDifference';
import type { GameState } from './useSpotDifference';
import type { DifficultyConfig, Puzzle } from '../lib/types';

const difficulty: DifficultyConfig = {
  id: 'easy',
  label: 'Easy',
  emoji: '🐣',
  itemCount: 4,
  diffCount: 2,
};

const puzzle: Puzzle = {
  left: { items: [] },
  right: { items: [] },
  differences: [
    { id: 'd0', kind: 'recolor', cx: 20, cy: 20, radius: 8 },
    { id: 'd1', kind: 'flip', cx: 70, cy: 70, radius: 8 },
  ],
  themeId: 'park',
  seed: 1,
};

function playing(): GameState {
  return reducer(initialState, { type: 'START', difficulty, puzzle, now: 1000 });
}

describe('useSpotDifference reducer', () => {
  it('START enters playing with a fresh slate', () => {
    const s = playing();
    expect(s.phase).toBe('playing');
    expect(s.difficulty).toBe(difficulty);
    expect(s.puzzle).toBe(puzzle);
    expect(s.found).toEqual([]);
    expect(s.wrongTaps).toBe(0);
    expect(s.hintsUsed).toBe(0);
    expect(s.startTime).toBe(1000);
    expect(s.result).toBeNull();
  });

  it('TAP on a difference adds it to found', () => {
    const s = reducer(playing(), { type: 'TAP', x: 20, y: 20 });
    expect(s.found).toEqual(['d0']);
    expect(s.wrongTaps).toBe(0);
    expect(s.phase).toBe('playing');
  });

  it('TAP does not double-count an already-found difference (counts as a miss)', () => {
    let s = reducer(playing(), { type: 'TAP', x: 20, y: 20 });
    s = reducer(s, { type: 'TAP', x: 20, y: 20 });
    expect(s.found).toEqual(['d0']);
    expect(s.wrongTaps).toBe(1);
    expect(s.lastMiss).toEqual({ x: 20, y: 20 });
  });

  it('TAP miss increments wrongTaps and records lastMiss without penalty to found', () => {
    const s = reducer(playing(), { type: 'TAP', x: 50, y: 50 });
    expect(s.found).toEqual([]);
    expect(s.wrongTaps).toBe(1);
    expect(s.lastMiss).toEqual({ x: 50, y: 50 });
    expect(s.phase).toBe('playing');
  });

  it('finding all differences wins and produces a result', () => {
    let s = reducer(playing(), { type: 'TAP', x: 20, y: 20 });
    s = reducer(s, { type: 'TAP', x: 70, y: 70 });
    expect(s.found).toEqual(['d0', 'd1']);
    expect(s.phase).toBe('won');
    expect(s.result).not.toBeNull();
    expect(s.result?.score).toBeGreaterThanOrEqual(300);
    expect(s.result?.score).toBeLessThanOrEqual(1000);
  });

  it('a successful TAP clears an active hint and lastMiss', () => {
    let s = reducer(playing(), { type: 'TAP', x: 50, y: 50 }); // miss -> lastMiss set
    s = reducer(s, { type: 'HINT' }); // hint set
    expect(s.hint).toBe('d0');
    expect(s.lastMiss).not.toBeNull();
    s = reducer(s, { type: 'TAP', x: 20, y: 20 }); // hit
    expect(s.hint).toBeNull();
    expect(s.lastMiss).toBeNull();
  });

  it('HINT flags the first unfound difference and counts a hint', () => {
    let s = reducer(playing(), { type: 'HINT' });
    expect(s.hint).toBe('d0');
    expect(s.hintsUsed).toBe(1);
    // after finding d0, the next hint points at d1
    s = reducer(s, { type: 'TAP', x: 20, y: 20 });
    s = reducer(s, { type: 'HINT' });
    expect(s.hint).toBe('d1');
    expect(s.hintsUsed).toBe(2);
  });

  it('TICK updates elapsedMs from startTime', () => {
    const s = reducer(playing(), { type: 'TICK', now: 4200 });
    expect(s.elapsedMs).toBe(3200);
  });

  it('RESET returns to the initial picking state', () => {
    const s = reducer(playing(), { type: 'RESET' });
    expect(s).toEqual(initialState);
  });

  it('ignores TAP/HINT/TICK when not playing', () => {
    expect(reducer(initialState, { type: 'TAP', x: 20, y: 20 })).toBe(initialState);
    expect(reducer(initialState, { type: 'HINT' })).toBe(initialState);
    expect(reducer(initialState, { type: 'TICK', now: 5000 })).toBe(initialState);
  });
});
