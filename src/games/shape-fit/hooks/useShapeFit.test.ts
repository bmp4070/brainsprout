import { describe, expect, it } from 'vitest';
import { initialState, orientedCells, reducer } from './useShapeFit';
import type { Action, GameState, TrayPiece } from './useShapeFit';
import { generatePuzzle } from '../lib/generator';
import { cellsKey } from '../lib/shapes';
import { cellKey, DIFFICULTIES } from '../lib/types';
import type { Cell, Piece, Puzzle } from '../lib/types';

function run(state: GameState, actions: Action[]): GameState {
  return actions.reduce((s, a) => reducer(s, a), state);
}

function startWith(puzzle: Puzzle, now = 1000): GameState {
  return reducer(initialState, {
    type: 'START',
    difficulty: DIFFICULTIES.easy,
    puzzle,
    now,
  });
}

/** Finds the (rot, flipped, at) that reproduces a solution placement. */
function orientFor(piece: Piece, cells: Cell[]): { rot: 0 | 1 | 2 | 3; flipped: boolean; at: Cell } {
  const targetKey = cellsKey(cells);
  let minR = Infinity;
  let minC = Infinity;
  for (const cell of cells) {
    if (cell.r < minR) minR = cell.r;
    if (cell.c < minC) minC = cell.c;
  }
  for (const flipped of [false, true]) {
    for (let rot = 0 as 0 | 1 | 2 | 3; rot < 4; rot = (rot + 1) as 0 | 1 | 2 | 3) {
      const tp: TrayPiece = { piece, rot, flipped, placedAt: null };
      if (cellsKey(orientedCells(tp)) === targetKey) {
        return { rot, flipped, at: { r: minR, c: minC } };
      }
    }
  }
  throw new Error('no orientation matches placement');
}

/** Drives a state to the win by following the puzzle's reference solution. */
function solveViaReducer(state: GameState, puzzle: Puzzle): GameState {
  let current = state;
  for (const placement of puzzle.solution) {
    const piece = puzzle.pieces.find((p) => p.id === placement.pieceId)!;
    const { rot, flipped, at } = orientFor(piece, placement.cells);
    const actions: Action[] = [{ type: 'SELECT', id: piece.id }];
    for (let i = 0; i < rot; i += 1) actions.push({ type: 'ROTATE' });
    if (flipped) actions.push({ type: 'FLIP' });
    actions.push({ type: 'PLACE', id: piece.id, at });
    current = run(current, actions);
  }
  return current;
}

// A hand-built puzzle with a forced dead end: an L-shaped 4-cell region that
// only tiles as a vertical + horizontal domino. Placing the first domino flat
// strands two non-adjacent cells.
const DOMINO_BASE: Cell[] = [{ r: 0, c: 0 }, { r: 0, c: 1 }];
const STUCK_PUZZLE: Puzzle = {
  rows: 2,
  cols: 3,
  region: [
    [true, true, true],
    [true, false, false],
  ],
  pieces: [
    { id: 0, cells: DOMINO_BASE, colorIndex: 0 },
    { id: 1, cells: DOMINO_BASE, colorIndex: 1 },
  ],
  solution: [
    { pieceId: 0, cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }] },
    { pieceId: 1, cells: [{ r: 0, c: 1 }, { r: 0, c: 2 }] },
  ],
  seed: 0,
};

describe('reducer: lifecycle', () => {
  it('START builds a full tray and enters playing', () => {
    const puzzle = generatePuzzle(DIFFICULTIES.easy, 0);
    const state = startWith(puzzle);
    expect(state.phase).toBe('playing');
    expect(state.tray).toHaveLength(puzzle.pieces.length);
    expect(state.tray.every((tp) => tp.placedAt === null)).toBe(true);
    expect(state.occupied).toEqual({});
    expect(state.startTime).toBe(1000);
  });

  it('ignores mutating actions when not playing', () => {
    expect(reducer(initialState, { type: 'SELECT', id: 3 })).toBe(initialState);
    expect(reducer(initialState, { type: 'ROTATE' })).toBe(initialState);
    expect(reducer(initialState, { type: 'PLACE', id: 0, at: { r: 0, c: 0 } })).toBe(initialState);
    expect(reducer(initialState, { type: 'HINT' })).toBe(initialState);
  });

  it('RESET returns to the initial state', () => {
    const state = startWith(generatePuzzle(DIFFICULTIES.easy, 0));
    expect(reducer(state, { type: 'RESET' })).toEqual(initialState);
  });
});

describe('reducer: selection and orientation', () => {
  it('SELECT sets and clears the selected id', () => {
    const state = startWith(generatePuzzle(DIFFICULTIES.easy, 0));
    expect(reducer(state, { type: 'SELECT', id: 1 }).selectedId).toBe(1);
    expect(reducer(state, { type: 'SELECT', id: null }).selectedId).toBeNull();
  });

  it('ROTATE cycles the selected piece orientation while in the tray', () => {
    const state = startWith(generatePuzzle(DIFFICULTIES.easy, 0));
    const rotated = run(state, [{ type: 'SELECT', id: 0 }, { type: 'ROTATE' }]);
    expect(rotated.tray[0].rot).toBe(1);
    expect(rotated.tray[0].placedAt).toBeNull();
  });

  it('FLIP toggles the flipped flag', () => {
    const state = startWith(generatePuzzle(DIFFICULTIES.easy, 0));
    const flipped = run(state, [{ type: 'SELECT', id: 0 }, { type: 'FLIP' }]);
    expect(flipped.tray[0].flipped).toBe(true);
  });

  it('ROTATE on a placed piece returns it to the tray and frees its cells', () => {
    const state = startWith(STUCK_PUZZLE);
    // Place piece 0 as a vertical domino at (0,0),(1,0).
    const placed = run(state, [
      { type: 'SELECT', id: 0 },
      { type: 'ROTATE' },
      { type: 'PLACE', id: 0, at: { r: 0, c: 0 } },
    ]);
    expect(placed.tray[0].placedAt).not.toBeNull();
    expect(Object.keys(placed.occupied).length).toBe(2);

    const lifted = run(placed, [{ type: 'SELECT', id: 0 }, { type: 'ROTATE' }]);
    expect(lifted.tray[0].placedAt).toBeNull();
    expect(lifted.occupied).toEqual({});
    expect(lifted.selectedId).toBe(0);
  });

  it('ROTATE/FLIP no-op when nothing is selected', () => {
    const state = startWith(generatePuzzle(DIFFICULTIES.easy, 0));
    expect(reducer(state, { type: 'ROTATE' })).toBe(state);
    expect(reducer(state, { type: 'FLIP' })).toBe(state);
  });
});

describe('reducer: placement', () => {
  it('PLACE covers the region cells and increments moves', () => {
    const state = startWith(STUCK_PUZZLE);
    const placed = run(state, [
      { type: 'SELECT', id: 0 },
      { type: 'ROTATE' },
      { type: 'PLACE', id: 0, at: { r: 0, c: 0 } },
    ]);
    expect(placed.moves).toBe(1);
    expect(placed.occupied[cellKey({ r: 0, c: 0 })]).toBe(0);
    expect(placed.occupied[cellKey({ r: 1, c: 0 })]).toBe(0);
  });

  it('rejects an illegal PLACE with misplacedAttempts++ and no corruption', () => {
    const state = startWith(STUCK_PUZZLE);
    // Base (flat) domino at (0,2) would spill outside the region.
    const rejected = reducer(state, { type: 'PLACE', id: 0, at: { r: 0, c: 2 } });
    expect(rejected.misplacedAttempts).toBe(1);
    expect(rejected.occupied).toEqual({});
    expect(rejected.tray[0].placedAt).toBeNull();
    expect(rejected.moves).toBe(0);
  });

  it('flags a dead end when remaining pieces can no longer tile the region', () => {
    const state = startWith(STUCK_PUZZLE);
    // Place the first domino FLAT at (0,0),(0,1): strands (0,2) and (1,0).
    const stuck = run(state, [
      { type: 'SELECT', id: 0 },
      { type: 'PLACE', id: 0, at: { r: 0, c: 0 } },
    ]);
    expect(stuck.phase).toBe('playing');
    expect(stuck.deadEnd).toBe(true);
  });

  it('PICKUP removes a placed piece and clears its cells', () => {
    const state = startWith(STUCK_PUZZLE);
    const placed = run(state, [
      { type: 'SELECT', id: 0 },
      { type: 'ROTATE' },
      { type: 'PLACE', id: 0, at: { r: 0, c: 0 } },
    ]);
    const pickedUp = reducer(placed, { type: 'PICKUP', id: 0 });
    expect(pickedUp.tray[0].placedAt).toBeNull();
    expect(pickedUp.occupied).toEqual({});
    expect(pickedUp.selectedId).toBe(0);
  });

  it('wins and scores when the region is fully covered', () => {
    const puzzle = generatePuzzle(DIFFICULTIES.easy, 3);
    const won = solveViaReducer(startWith(puzzle), puzzle);
    expect(won.phase).toBe('won');
    expect(won.result).not.toBeNull();
    expect(won.result!.score).toBeGreaterThanOrEqual(300);
    expect(Object.keys(won.occupied).length).toBe(puzzle.pieces.reduce((n, p) => n + p.cells.length, 0));
  });
});

describe('reducer: hint, restart, tick', () => {
  it('HINT sets a placement and increments hintsUsed', () => {
    const puzzle = generatePuzzle(DIFFICULTIES.easy, 0);
    const hinted = reducer(startWith(puzzle), { type: 'HINT' });
    expect(hinted.hint).not.toBeNull();
    expect(hinted.hintsUsed).toBe(1);
  });

  it('RESTART clears the board but keeps hintsUsed', () => {
    const puzzle = generatePuzzle(DIFFICULTIES.easy, 0);
    const played = run(startWith(puzzle), [
      { type: 'HINT' },
      { type: 'SELECT', id: 0 },
      { type: 'PLACE', id: 0, at: { r: 0, c: 0 } },
    ]);
    const restarted = reducer(played, { type: 'RESTART' });
    expect(restarted.phase).toBe('playing');
    expect(restarted.occupied).toEqual({});
    expect(restarted.moves).toBe(0);
    expect(restarted.misplacedAttempts).toBe(0);
    expect(restarted.tray.every((tp) => tp.placedAt === null)).toBe(true);
    expect(restarted.hintsUsed).toBe(played.hintsUsed);
  });

  it('TICK updates elapsedMs only while playing', () => {
    const state = startWith(generatePuzzle(DIFFICULTIES.easy, 0), 1000);
    const ticked = reducer(state, { type: 'TICK', now: 6000 });
    expect(ticked.elapsedMs).toBe(5000);
    // Not playing: no change.
    expect(reducer(initialState, { type: 'TICK', now: 6000 })).toBe(initialState);
  });
});
