import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './useMathCrossword';
import type { GameState } from './useMathCrossword';
import { generatePuzzle } from '../lib/generator';
import { DIFFICULTIES } from '../lib/types';

const difficulty = DIFFICULTIES.easy;
const puzzle = generatePuzzle(difficulty, 12345);

function playing(now = 1000): GameState {
  return reducer(initialState, { type: 'START', difficulty, puzzle, now });
}

describe('math-crossword reducer', () => {
  it('START enters playing and focuses the first blank', () => {
    const s = playing();
    expect(s.phase).toBe('playing');
    expect(s.puzzle).toBe(puzzle);
    expect(s.activeBlankId).toBe(puzzle.blanks[0].id);
  });

  it('a correct answer locks the blank and advances focus', () => {
    const first = puzzle.blanks[0];
    const s = reducer(playing(), { type: 'ANSWER', blankId: first.id, choiceIndex: first.correctIndex });
    expect(s.solved[first.id]).toBe(first.answer);
    expect(s.mistakes).toBe(0);
    if (puzzle.blanks.length > 1) {
      expect(s.activeBlankId).toBe(puzzle.blanks[1].id);
    }
  });

  it('a wrong answer counts a mistake and leaves the blank open', () => {
    const first = puzzle.blanks[0];
    const wrongIndex = (first.correctIndex + 1) % 4;
    const s = reducer(playing(), { type: 'ANSWER', blankId: first.id, choiceIndex: wrongIndex });
    expect(s.solved[first.id]).toBeUndefined();
    expect(s.mistakes).toBe(1);
    expect(s.wrongChoiceIndex).toBe(wrongIndex);
  });

  it('solving every blank wins and scores the round', () => {
    let s = playing();
    for (const blank of puzzle.blanks) {
      s = reducer(s, { type: 'ANSWER', blankId: blank.id, choiceIndex: blank.correctIndex });
    }
    expect(s.phase).toBe('won');
    expect(s.result).not.toBeNull();
    expect(Object.keys(s.solved)).toHaveLength(puzzle.blanks.length);
  });

  it('HINT fills a blank for free and counts a hint', () => {
    const s = reducer(playing(), { type: 'HINT' });
    expect(s.hintsUsed).toBe(1);
    expect(Object.keys(s.solved)).toHaveLength(1);
  });

  it('a hint that fills the last blank still wins', () => {
    // Solve all but one, then hint the last.
    let s = playing();
    for (const blank of puzzle.blanks.slice(0, -1)) {
      s = reducer(s, { type: 'ANSWER', blankId: blank.id, choiceIndex: blank.correctIndex });
    }
    s = reducer(s, { type: 'HINT' });
    expect(s.phase).toBe('won');
  });

  it('ignores answers outside the playing phase', () => {
    const s = reducer(initialState, { type: 'ANSWER', blankId: 0, choiceIndex: 0 });
    expect(s).toBe(initialState);
  });

  it('RESET returns to the initial state', () => {
    expect(reducer(playing(), { type: 'RESET' })).toEqual(initialState);
  });
});
