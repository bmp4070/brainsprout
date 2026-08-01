import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './useMemoryBelt';
import type { GameState } from './useMemoryBelt';
import { generateRound } from '../lib/generator';
import { DIFFICULTIES } from '../lib/types';

const difficulty = DIFFICULTIES.easy;
const round = generateRound(difficulty, 42);

function studying(now = 1000): GameState {
  return reducer(initialState, { type: 'START', difficulty, round, now });
}

describe('memory-belt reducer', () => {
  it('START enters the study phase with a full countdown', () => {
    const s = studying(1000);
    expect(s.phase).toBe('study');
    expect(s.studyMsTotal).toBe(difficulty.studySeconds * 1000);
    expect(s.studyMsLeft).toBe(difficulty.studySeconds * 1000);
    expect(s.round).toBe(round);
  });

  it('STUDY_TICK counts down and auto-starts recall when time runs out', () => {
    const s = studying(1000);
    const mid = reducer(s, { type: 'STUDY_TICK', now: 1000 + 5000 });
    expect(mid.phase).toBe('study');
    expect(mid.studyMsLeft).toBe(difficulty.studySeconds * 1000 - 5000);

    const done = reducer(s, { type: 'STUDY_TICK', now: 1000 + difficulty.studySeconds * 1000 + 1 });
    expect(done.phase).toBe('recall');
    expect(done.elapsedMs).toBe(0);
  });

  it('READY skips remaining study time and starts recall', () => {
    const s = studying(1000);
    const r = reducer(s, { type: 'READY', now: 2000 });
    expect(r.phase).toBe('recall');
    expect(r.recallStart).toBe(2000);
  });

  it('tapping a target catches it; tapping a decoy only costs accuracy', () => {
    const recall = reducer(studying(), { type: 'READY', now: 2000 });
    const target = round.targetIds[0];
    const decoy = round.belt.find((b) => !b.isTarget)!.itemId;

    const caught = reducer(recall, { type: 'TAP', itemId: target, now: 2100 });
    expect(caught.found).toContain(target);
    expect(caught.wrongTaps).toBe(0);

    const missed = reducer(recall, { type: 'TAP', itemId: decoy, now: 2100 });
    expect(missed.found).toHaveLength(0);
    expect(missed.wrongTaps).toBe(1);
    expect(missed.lastWrong).toBe(decoy);
  });

  it('a target can only be caught once', () => {
    let s = reducer(studying(), { type: 'READY', now: 2000 });
    const target = round.targetIds[0];
    s = reducer(s, { type: 'TAP', itemId: target, now: 2100 });
    const again = reducer(s, { type: 'TAP', itemId: target, now: 2200 });
    expect(again.found).toEqual(s.found);
  });

  it('catching every target wins and produces a scored result', () => {
    let s = reducer(studying(), { type: 'READY', now: 2000 });
    for (const id of round.targetIds) {
      s = reducer(s, { type: 'TAP', itemId: id, now: 2100 });
    }
    expect(s.phase).toBe('won');
    expect(s.result).not.toBeNull();
    expect(s.found).toHaveLength(round.targetIds.length);
  });

  it('ignores taps outside the recall phase', () => {
    const s = studying();
    const tapped = reducer(s, { type: 'TAP', itemId: round.targetIds[0], now: 1500 });
    expect(tapped).toBe(s);
  });

  it('RESET returns to the initial state', () => {
    const s = reducer(studying(), { type: 'READY', now: 2000 });
    expect(reducer(s, { type: 'RESET' })).toEqual(initialState);
  });
});
