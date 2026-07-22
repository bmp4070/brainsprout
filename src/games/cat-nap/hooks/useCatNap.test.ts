import { describe, expect, it } from 'vitest';
import { initialState, reducer } from './useCatNap';
import type { GameState } from './useCatNap';
import { generatePuzzle } from '../lib/generator';
import { DIFFICULTIES } from '../lib/types';
import type { CellPos, Puzzle } from '../lib/types';

function startGame(puzzle: Puzzle, now = 1000): GameState {
  return reducer(initialState, {
    type: 'START',
    difficulty: DIFFICULTIES.easy,
    puzzle,
    now,
  });
}

function cycle(state: GameState, pos: CellPos): GameState {
  return reducer(state, { type: 'CYCLE_CELL', row: pos.row, col: pos.col });
}

/** Places the full solution (one cat per region) via CYCLE_CELL. */
function placeSolution(state: GameState, puzzle: Puzzle): GameState {
  let next = state;
  for (const cell of puzzle.solution) {
    next = cycle(next, cell); // empty -> cat
  }
  return next;
}

describe('cat-nap reducer', () => {
  const easyPuzzle = generatePuzzle(DIFFICULTIES.easy, 7);

  it('starts a game with an empty marks grid', () => {
    const state = startGame(easyPuzzle);
    expect(state.phase).toBe('playing');
    expect(state.puzzle).toBe(easyPuzzle);
    expect(state.marks).not.toBeNull();
    expect(state.marks!.length).toBe(easyPuzzle.size);
    expect(state.marks!.every((r) => r.every((c) => c === 'empty'))).toBe(true);
    expect(state.conflicts.size).toBe(0);
    expect(state.startTime).toBe(1000);
  });

  it('cycles a cell empty -> cat -> paw -> empty', () => {
    let state = startGame(easyPuzzle);
    state = cycle(state, { row: 0, col: 0 });
    expect(state.marks![0][0]).toBe('cat');
    state = cycle(state, { row: 0, col: 0 });
    expect(state.marks![0][0]).toBe('paw');
    state = cycle(state, { row: 0, col: 0 });
    expect(state.marks![0][0]).toBe('empty');
  });

  it('recomputes conflicts on each cycle', () => {
    let state = startGame(easyPuzzle);
    // Two cats in the same row (0,0) and (0,1): both flagged.
    state = cycle(state, { row: 0, col: 0 });
    expect(state.conflicts.size).toBe(0);
    state = cycle(state, { row: 0, col: 1 });
    expect(state.conflicts).toEqual(new Set(['0,0', '0,1']));
    // Clearing one (cat -> paw) resolves the conflict.
    state = cycle(state, { row: 0, col: 1 });
    expect(state.conflicts.size).toBe(0);
  });

  it('wins when the full solution is placed', () => {
    let state = startGame(easyPuzzle, 0);
    state = reducer(state, { type: 'TICK', now: 5000 });
    state = placeSolution(state, easyPuzzle);
    expect(state.phase).toBe('won');
    expect(state.conflicts.size).toBe(0);
    expect(state.score).toBeGreaterThanOrEqual(300);
    expect(state.score).toBeLessThanOrEqual(1000);
  });

  it('HINT places the correct cat, clears a wrong cat, increments hintsUsed', () => {
    let state = startGame(easyPuzzle);
    const region0Solution = easyPuzzle.solution[0];
    // Put a wrong cat somewhere else in region 0.
    let wrongCell: CellPos | null = null;
    for (let r = 0; r < easyPuzzle.size && !wrongCell; r++) {
      for (let c = 0; c < easyPuzzle.size; c++) {
        if (
          easyPuzzle.regions[r][c] === 0 &&
          !(r === region0Solution.row && c === region0Solution.col)
        ) {
          wrongCell = { row: r, col: c };
          break;
        }
      }
    }
    if (wrongCell) {
      state = cycle(state, wrongCell);
      expect(state.marks![wrongCell.row][wrongCell.col]).toBe('cat');
    }

    state = reducer(state, { type: 'HINT' });
    expect(state.hintsUsed).toBe(1);
    expect(state.marks![region0Solution.row][region0Solution.col]).toBe('cat');
    if (wrongCell) {
      expect(state.marks![wrongCell.row][wrongCell.col]).toBe('empty');
    }
  });

  it('HINT can complete and win the puzzle', () => {
    let state = startGame(easyPuzzle);
    // Place all but the last region via cycles, then hint the final region.
    for (let i = 0; i < easyPuzzle.solution.length - 1; i++) {
      state = cycle(state, easyPuzzle.solution[i]);
    }
    expect(state.phase).toBe('playing');
    state = reducer(state, { type: 'HINT' });
    expect(state.phase).toBe('won');
    expect(state.hintsUsed).toBe(1);
  });

  it('applies a visible hint penalty to the score', () => {
    // Win cleanly (no hints).
    let clean = startGame(easyPuzzle, 0);
    clean = reducer(clean, { type: 'TICK', now: 3000 });
    clean = placeSolution(clean, easyPuzzle);

    // Win using a hint (same elapsed time), which drops the accuracy component.
    let hinted = startGame(easyPuzzle, 0);
    hinted = reducer(hinted, { type: 'TICK', now: 3000 });
    for (let i = 0; i < easyPuzzle.solution.length - 1; i++) {
      hinted = cycle(hinted, easyPuzzle.solution[i]);
    }
    hinted = reducer(hinted, { type: 'HINT' });

    expect(hinted.phase).toBe('won');
    expect(clean.phase).toBe('won');
    expect(hinted.score).toBeLessThan(clean.score);
    expect(hinted.score).toBeGreaterThanOrEqual(300);
  });

  it('updates elapsedMs on TICK while playing, not otherwise', () => {
    const playing = startGame(easyPuzzle, 1000);
    const ticked = reducer(playing, { type: 'TICK', now: 4500 });
    expect(ticked.elapsedMs).toBe(3500);

    const picking = reducer(initialState, { type: 'TICK', now: 4500 });
    expect(picking.elapsedMs).toBe(0);
  });

  it('RESET returns to the initial picking state', () => {
    let state = startGame(easyPuzzle);
    state = cycle(state, { row: 0, col: 0 });
    state = reducer(state, { type: 'RESET' });
    expect(state).toEqual(initialState);
    expect(state.phase).toBe('picking');
  });

  it('ignores CYCLE_CELL and HINT when not playing', () => {
    const picking = reducer(initialState, { type: 'CYCLE_CELL', row: 0, col: 0 });
    expect(picking).toBe(initialState);
    const noHint = reducer(initialState, { type: 'HINT' });
    expect(noHint).toBe(initialState);

    const won = { ...startGame(easyPuzzle), phase: 'won' as const };
    expect(reducer(won, { type: 'CYCLE_CELL', row: 0, col: 0 })).toBe(won);
  });
});
