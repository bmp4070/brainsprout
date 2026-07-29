import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './useWordWheel';
import { DIFFICULTIES } from '../lib/types';
import { generatePuzzle } from '../lib/generator';

describe('useWordWheel reducer', () => {
  const diff = DIFFICULTIES.easy;
  const puzzle = generatePuzzle(diff, 100);

  it('starts a new game', () => {
    const state = reducer(initialState, { type: 'START', difficulty: diff, puzzle, now: 1000 });
    expect(state.phase).toBe('playing');
    expect(state.puzzle).toBe(puzzle);
    expect(state.selection).toEqual([]);
    expect(state.found).toEqual([]);
  });

  it('handles letter selection, backspace, and clear', () => {
    let state = reducer(initialState, { type: 'START', difficulty: diff, puzzle, now: 1000 });
    state = reducer(state, { type: 'TAP_LETTER', index: 0 });
    state = reducer(state, { type: 'TAP_LETTER', index: 1 });
    expect(state.selection).toEqual([0, 1]);

    // Duplicate selection is ignored
    state = reducer(state, { type: 'TAP_LETTER', index: 0 });
    expect(state.selection).toEqual([0, 1]);

    // Backspace removes last letter
    state = reducer(state, { type: 'BACKSPACE' });
    expect(state.selection).toEqual([0]);

    // Clear empties selection
    state = reducer(state, { type: 'CLEAR_SELECTION' });
    expect(state.selection).toEqual([]);
  });

  it('submits valid and invalid words', () => {
    let state = reducer(initialState, { type: 'START', difficulty: diff, puzzle, now: 1000 });

    // Submit invalid word
    state = reducer(state, { type: 'TAP_LETTER', index: 0 });
    state = reducer(state, { type: 'SUBMIT' });
    expect(state.lastResult).toBe('invalid');
    expect(state.invalidAttempts).toBe(1);

    // Submit valid word
    const targetWord = puzzle.words[0];
    // Find indices matching targetWord letters
    const indices: number[] = [];
    const used = new Set<number>();
    for (const char of targetWord.toUpperCase()) {
      const idx = puzzle.letters.findIndex((l, i) => l === char && !used.has(i));
      if (idx !== -1) {
        used.add(idx);
        indices.push(idx);
      }
    }

    if (indices.length === targetWord.length) {
      indices.forEach((idx) => {
        state = reducer(state, { type: 'TAP_LETTER', index: idx });
      });
      state = reducer(state, { type: 'SUBMIT' });
      expect(state.lastResult).toBe('correct');
      expect(state.found).toContain(targetWord);
    }
  });

  it('provides hints for target words', () => {
    let state = reducer(initialState, { type: 'START', difficulty: diff, puzzle, now: 1000 });
    state = reducer(state, { type: 'HINT' });
    expect(state.hintsUsed).toBe(1);
    expect(Object.keys(state.revealed).length).toBe(1);
  });
});
