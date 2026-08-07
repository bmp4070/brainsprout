import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './useStrawDrop';
import type { GameState } from './useStrawDrop';
import { DIFFICULTIES } from '../lib/types';

const difficulty = DIFFICULTIES.easy; // target 5

function playing(now = 1000): GameState {
  return reducer(initialState, { type: 'START', difficulty, now });
}

describe('straw-drop reducer', () => {
  it('START enters playing at zero progress', () => {
    const s = playing();
    expect(s.phase).toBe('playing');
    expect(s.filled).toBe(0);
    expect(s.misses).toBe(0);
    expect(s.difficulty).toBe(difficulty);
  });

  it('HIT increments filled and flags the last drop', () => {
    const s = reducer(playing(), { type: 'HIT', now: 1100 });
    expect(s.filled).toBe(1);
    expect(s.lastDrop).toBe('hit');
    expect(s.dropSeq).toBe(1);
  });

  it('MISS increments misses without filling', () => {
    const s = reducer(playing(), { type: 'MISS' });
    expect(s.filled).toBe(0);
    expect(s.misses).toBe(1);
    expect(s.lastDrop).toBe('miss');
  });

  it('wins once the target is filled and scores the round', () => {
    let s = playing();
    for (let i = 0; i < difficulty.target; i += 1) {
      s = reducer(s, { type: 'HIT', now: 1100 + i });
    }
    expect(s.phase).toBe('won');
    expect(s.filled).toBe(difficulty.target);
    expect(s.result).not.toBeNull();
  });

  it('ignores HIT / MISS outside the playing phase', () => {
    expect(reducer(initialState, { type: 'HIT', now: 1 })).toBe(initialState);
    expect(reducer(initialState, { type: 'MISS' })).toBe(initialState);
  });

  it('TICK updates elapsed only while playing', () => {
    const s = reducer(playing(1000), { type: 'TICK', now: 4000 });
    expect(s.elapsedMs).toBe(3000);
  });

  it('RESET returns to the initial state', () => {
    expect(reducer(playing(), { type: 'RESET' })).toEqual(initialState);
  });
});
