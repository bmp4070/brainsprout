import { describe, expect, it } from 'vitest';
import { generatePuzzle } from '../lib/generator';
import { hintMove } from '../lib/solver';
import { DIFFICULTIES } from '../lib/types';
import type { BoardState, DifficultyConfig, Puzzle } from '../lib/types';
import { initialState, reducer } from './usePotionSort';
import type { GameState } from './usePotionSort';

/** A small, fully hand-built (non-generated) board for deterministic control
 * over exactly how many pours are needed and what's legal at each step.
 *
 * bottle0: [0,0,0,1]   bottle1: [1,1,1,0]   bottle2: []   bottle3: []
 *
 * Solution: pour 0->2 (moves the lone 1), pour 1->0 (completes bottle0),
 * pour 2->1 (completes bottle1). Exactly 3 pours.
 */
const TEST_DIFFICULTY: DifficultyConfig = {
  id: 'easy',
  label: 'Easy',
  emoji: '🐣',
  colorCount: 2,
  emptyBottles: 2,
};

function smallBoard(): BoardState {
  return [
    [0, 0, 0, 1],
    [1, 1, 1, 0],
    [],
    [],
  ];
}

function smallPuzzle(): Puzzle {
  return { board: smallBoard(), difficulty: 'easy', seed: 1, par: 3, parExact: true };
}

function started(puzzle: Puzzle = smallPuzzle(), difficulty: DifficultyConfig = TEST_DIFFICULTY): GameState {
  return reducer(initialState, { type: 'START', difficulty, puzzle });
}

describe('usePotionSort reducer: selection', () => {
  it('selects a non-empty bottle on first tap', () => {
    const s = reducer(started(), { type: 'TAP_BOTTLE', index: 0 });
    expect(s.selected).toBe(0);
  });

  it('does not select an empty bottle', () => {
    const s = reducer(started(), { type: 'TAP_BOTTLE', index: 2 });
    expect(s.selected).toBeNull();
  });

  it('tapping the selected bottle again deselects it', () => {
    let s = started();
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 });
    expect(s.selected).toBe(0);
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 });
    expect(s.selected).toBeNull();
  });

  it('tapping a different non-empty, illegal target switches the selection to it', () => {
    // bottle0 top=1, bottle1 top=0: neither matches, so selecting 0 then
    // tapping 1 is illegal and should just move the "lifted" bottle to 1.
    let s = started();
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 });
    s = reducer(s, { type: 'TAP_BOTTLE', index: 1 });
    expect(s.selected).toBe(1);
    expect(s.pours).toBe(0);
  });

  it('tapping a legal empty target pours and clears the selection', () => {
    // bottle0's top (color1) may legally pour into the empty bottle2.
    let s = started();
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 });
    s = reducer(s, { type: 'TAP_BOTTLE', index: 2 });
    expect(s.selected).toBeNull();
    expect(s.pours).toBe(1);
  });
});

describe('usePotionSort reducer: pouring', () => {
  it('a legal pour increments pours, updates the board, and pushes history', () => {
    let s = started();
    const boardBefore = s.board;
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 });
    s = reducer(s, { type: 'TAP_BOTTLE', index: 2 });
    expect(s.pours).toBe(1);
    expect(s.board).not.toBe(boardBefore);
    expect(s.board).toEqual([
      [0, 0, 0],
      [1, 1, 1, 0],
      [1],
      [],
    ]);
    expect(s.history).toEqual([boardBefore]);
    expect(s.selected).toBeNull();
  });
});

describe('usePotionSort reducer: UNDO', () => {
  it('restores the exact previous board and decrements pours', () => {
    let s = started();
    const boardBefore = s.board;
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 });
    s = reducer(s, { type: 'TAP_BOTTLE', index: 2 });
    expect(s.pours).toBe(1);
    s = reducer(s, { type: 'UNDO' });
    expect(s.board).toEqual(boardBefore);
    expect(s.pours).toBe(0);
    expect(s.history).toEqual([]);
  });

  it('floors pours at 0 and no-ops when there is nothing to undo', () => {
    const s0 = started();
    const s1 = reducer(s0, { type: 'UNDO' });
    expect(s1).toBe(s0);
    expect(s1.pours).toBe(0);
  });
});

describe('usePotionSort reducer: RESTART', () => {
  it('resets the board and pours back to the puzzle start', () => {
    let s = started();
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 });
    s = reducer(s, { type: 'TAP_BOTTLE', index: 2 });
    s = reducer(s, { type: 'RESTART' });
    expect(s.board).toEqual(smallBoard());
    expect(s.pours).toBe(0);
    expect(s.history).toEqual([]);
    expect(s.phase).toBe('playing');
  });
});

describe('usePotionSort reducer: HINT', () => {
  it('sets state.hint and increments hintsUsed', () => {
    let s = started();
    s = reducer(s, { type: 'HINT' });
    expect(s.hint).not.toBeNull();
    expect(s.hintsUsed).toBe(1);
    s = reducer(s, { type: 'HINT' });
    expect(s.hintsUsed).toBe(2);
  });
});

describe('usePotionSort reducer: winning', () => {
  it('driving the small hand-built board to completion sets phase won + result', () => {
    let s = started();
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 }); // lift bottle0 (top=1)
    s = reducer(s, { type: 'TAP_BOTTLE', index: 2 }); // pour into empty bottle2
    s = reducer(s, { type: 'TAP_BOTTLE', index: 1 }); // lift bottle1 (top=0)
    s = reducer(s, { type: 'TAP_BOTTLE', index: 0 }); // pour onto bottle0 (top=0) -> completes it
    s = reducer(s, { type: 'TAP_BOTTLE', index: 2 }); // lift bottle2 (the parked 1)
    s = reducer(s, { type: 'TAP_BOTTLE', index: 1 }); // pour onto bottle1 -> completes it
    expect(s.phase).toBe('won');
    expect(s.pours).toBe(3);
    expect(s.result).not.toBeNull();
    expect(s.result?.stars).toBeGreaterThanOrEqual(1);
  });

  it('a full generated puzzle can be driven to a win by repeatedly following hints', () => {
    const puzzle = generatePuzzle(DIFFICULTIES.easy, 7);
    let s = reducer(initialState, { type: 'START', difficulty: DIFFICULTIES.easy, puzzle });
    let guard = 0;
    while (s.phase === 'playing' && guard < 200) {
      guard += 1;
      const move = hintMove(s.board!);
      expect(move).not.toBeNull();
      if (!move) break;
      s = reducer(s, { type: 'TAP_BOTTLE', index: move.from });
      s = reducer(s, { type: 'TAP_BOTTLE', index: move.to });
    }
    expect(s.phase).toBe('won');
    expect(s.result).not.toBeNull();
  });
});

describe('usePotionSort reducer: dead end', () => {
  it('flags deadEnd on a board with no legal moves and no empty bottles', () => {
    const deadDifficulty: DifficultyConfig = {
      id: 'easy',
      label: 'Easy',
      emoji: '🐣',
      colorCount: 2,
      emptyBottles: 0,
    };
    const deadBoard: BoardState = [
      [0, 1, 0, 1],
      [1, 0, 1, 0],
    ];
    const puzzle: Puzzle = { board: deadBoard, difficulty: 'easy', seed: 1, par: 99, parExact: false };
    const s = reducer(initialState, { type: 'START', difficulty: deadDifficulty, puzzle });
    expect(s.deadEnd).toBe(true);
    expect(s.phase).toBe('playing');
  });
});

describe('usePotionSort reducer: no-ops outside playing', () => {
  it('TAP_BOTTLE, UNDO, and HINT are no-ops while picking', () => {
    expect(reducer(initialState, { type: 'TAP_BOTTLE', index: 0 })).toBe(initialState);
    expect(reducer(initialState, { type: 'UNDO' })).toBe(initialState);
    expect(reducer(initialState, { type: 'HINT' })).toBe(initialState);
  });

  it('RESET returns to the initial picking state from anywhere', () => {
    const s = started();
    const reset = reducer(s, { type: 'RESET' });
    expect(reset).toEqual(initialState);
    expect(reset.phase).toBe('picking');
  });
});
