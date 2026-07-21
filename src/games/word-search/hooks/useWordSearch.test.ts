import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './useWordSearch';
import type { GameState } from './useWordSearch';
import { generatePuzzle } from '../lib/generator';
import { DIFFICULTIES } from '../lib/types';
import { wingsOfFire } from '../themes/wings-of-fire';

function selectWord(
  state: GameState,
  anchor: { row: number; col: number },
  current: { row: number; col: number },
): GameState {
  let next = reducer(state, { type: 'SELECT_START', cell: anchor });
  next = reducer(next, { type: 'SELECT_MOVE', cell: current });
  next = reducer(next, { type: 'SELECT_END' });
  return next;
}

describe('word search reducer', () => {
  const puzzle = generatePuzzle(wingsOfFire, DIFFICULTIES.easy, 7);

  it('starts a game with the given puzzle', () => {
    const state = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 1000,
    });
    expect(state.phase).toBe('playing');
    expect(state.puzzle).toBe(puzzle);
    expect(state.found).toEqual([]);
    expect(state.startTime).toBe(1000);
    expect(state.score).toBe(0);
  });

  it('advances elapsedMs on TICK while playing, not while picking', () => {
    const playing = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 1000,
    });
    const ticked = reducer(playing, { type: 'TICK', now: 3500 });
    expect(ticked.elapsedMs).toBe(2500);

    const notPlaying = reducer(initialState, { type: 'TICK', now: 3500 });
    expect(notPlaying.elapsedMs).toBe(0);
  });

  it('finds a word when the selection matches a placement (forward)', () => {
    const started = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 0,
    });
    const first = puzzle.placements[0];
    const afterSelect = selectWord(
      started,
      first.cells[0],
      first.cells[first.cells.length - 1],
    );
    expect(afterSelect.found).toHaveLength(1);
    expect(afterSelect.found[0].word).toBe(first.word);
    expect(afterSelect.found[0].colorIndex).toBe(0);
    expect(afterSelect.selection).toBeNull();
  });

  it('rejects a selection that matches no placement', () => {
    const started = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 0,
    });
    // A single, isolated cell far from any word start rarely matches.
    const afterSelect = selectWord(
      started,
      { row: 0, col: 0 },
      { row: 0, col: 0 },
    );
    // A single cell only matches a placement of length 1, which none of our
    // words are, so nothing should be found.
    expect(afterSelect.found).toHaveLength(0);
  });

  it('sets a deterministic hint cell for the first unfound word and charges a penalty', () => {
    const started = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 0,
    });
    const hinted = reducer(started, { type: 'HINT' });
    expect(hinted.hintCell).toEqual(puzzle.placements[0].cells[0]);
    expect(hinted.hintsUsed).toBe(1);

    const cleared = reducer(hinted, { type: 'CLEAR_HINT' });
    expect(cleared.hintCell).toBeNull();
    expect(cleared.hintsUsed).toBe(1);
  });

  it('hint skips already-found words', () => {
    const started = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 0,
    });
    const first = puzzle.placements[0];
    const afterFind = selectWord(
      started,
      first.cells[0],
      first.cells[first.cells.length - 1],
    );
    const hinted = reducer(afterFind, { type: 'HINT' });
    expect(hinted.hintCell).toEqual(puzzle.placements[1].cells[0]);
  });

  it('wins after finding every placement and computes the score', () => {
    let state: GameState = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 0,
    });
    state = reducer(state, { type: 'TICK', now: 2000 }); // 2 elapsed seconds
    state = reducer(state, { type: 'HINT' }); // one hint penalty

    for (const placement of puzzle.placements) {
      state = selectWord(
        state,
        placement.cells[0],
        placement.cells[placement.cells.length - 1],
      );
    }

    expect(state.phase).toBe('won');
    expect(state.found).toHaveLength(puzzle.placements.length);

    const wordsFound = puzzle.placements.length;
    const timeBonus = Math.max(0, 300 - 2);
    const expectedScore = Math.max(
      0,
      wordsFound * 100 + timeBonus - 1 * 25,
    );
    expect(state.score).toBe(expectedScore);
  });

  it('never lets the score go negative', () => {
    let state: GameState = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 0,
    });
    // Rack up a huge elapsed time and many hints to try to drive score negative.
    state = reducer(state, { type: 'TICK', now: 10_000_000 });
    for (let i = 0; i < 50; i++) {
      state = reducer(state, { type: 'HINT' });
    }
    expect(state.hintsUsed).toBe(50);
    for (const placement of puzzle.placements) {
      state = selectWord(
        state,
        placement.cells[0],
        placement.cells[placement.cells.length - 1],
      );
    }
    expect(state.phase).toBe('won');
    expect(state.score).toBeGreaterThanOrEqual(0);
  });

  it('RESET returns to the initial picking state', () => {
    const started = reducer(initialState, {
      type: 'START',
      difficulty: DIFFICULTIES.easy,
      puzzle,
      now: 0,
    });
    const reset = reducer(started, { type: 'RESET' });
    expect(reset).toEqual(initialState);
  });
});
