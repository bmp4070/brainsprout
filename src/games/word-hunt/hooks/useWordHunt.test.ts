import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './useWordHunt';
import type { GameState } from './useWordHunt';
import { findPath } from '../lib/solver';
import type { Cell, DifficultyConfig, Puzzle } from '../lib/types';

const difficulty: DifficultyConfig = {
  id: 'easy',
  label: 'Easy',
  emoji: '🐣',
  size: 3,
  minWordLen: 3,
  targetWords: 2,
};

const grid = [
  ['C', 'A', 'T'],
  ['O', 'D', 'S'],
  ['G', 'O', 'R'],
];

const puzzle: Puzzle = {
  grid,
  size: 3,
  minWordLen: 3,
  solutions: ['cat', 'cats', 'dog'],
  targetWords: 2,
  seed: 1,
};

function playing(now = 1000): GameState {
  return reducer(initialState, { type: 'START', difficulty, puzzle, now });
}

const CAT: Cell[] = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: 2 },
];

describe('word-hunt reducer', () => {
  it('START enters playing with the puzzle', () => {
    const s = playing();
    expect(s.phase).toBe('playing');
    expect(s.puzzle).toBe(puzzle);
    expect(s.found).toHaveLength(0);
  });

  it('accepts a valid traced word', () => {
    const s = reducer(playing(), { type: 'SUBMIT', path: CAT });
    expect(s.found).toEqual(['cat']);
    expect(s.lastOutcome).toBe('found');
  });

  it('rejects a word not on the board', () => {
    // "cog" — trace C(0,0) -> O(1,0) -> G(2,0); not in solutions here.
    const path: Cell[] = [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
    ];
    const s = reducer(playing(), { type: 'SUBMIT', path });
    expect(s.found).toHaveLength(0);
    expect(s.lastOutcome).toBe('not-a-word');
  });

  it('rejects a discontinuous path as invalid', () => {
    const path: Cell[] = [
      { row: 0, col: 0 },
      { row: 2, col: 2 },
    ];
    const s = reducer(playing(), { type: 'SUBMIT', path });
    expect(s.lastOutcome).toBe('invalid');
  });

  it('rejects a duplicate word', () => {
    let s = reducer(playing(), { type: 'SUBMIT', path: CAT });
    s = reducer(s, { type: 'SUBMIT', path: CAT });
    expect(s.found).toEqual(['cat']);
    expect(s.lastOutcome).toBe('duplicate');
  });

  it('wins when the target word count is reached', () => {
    let s = playing();
    s = reducer(s, { type: 'SUBMIT', path: CAT });
    const dogPath = findPath(grid, 'dog')!;
    s = reducer(s, { type: 'SUBMIT', path: dogPath });
    expect(s.phase).toBe('won');
    expect(s.result).not.toBeNull();
    expect(s.found).toHaveLength(2);
  });

  it('HINT reveals a path to an unfound word and counts a hint', () => {
    const s = reducer(playing(), { type: 'HINT' });
    expect(s.hintPath).not.toBeNull();
    expect(s.hintsUsed).toBe(1);
  });

  it('ignores submits outside the playing phase', () => {
    const s = reducer(initialState, { type: 'SUBMIT', path: CAT });
    expect(s).toBe(initialState);
  });

  it('RESET returns to the initial state', () => {
    expect(reducer(playing(), { type: 'RESET' })).toEqual(initialState);
  });
});
