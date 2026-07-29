import { describe, expect, it } from 'vitest';
import { initialState, orientedTris, reducer } from './useShapeFit';
import type { GameState } from './useShapeFit';
import { DIFFICULTIES, triKey } from '../lib/types';
import type { Piece, Puzzle, Tri } from '../lib/types';

const CELL = (r: number, c: number): Tri[] =>
  ([0, 1, 2, 3] as Tri['d'][]).map((d) => ({ r, c, d }));

function square(id: number): Piece {
  return { id, tris: CELL(0, 0), colorIndex: id % 7, kind: 'square' };
}
function half(id: number): Piece {
  return { id, tris: [{ r: 0, c: 0, d: 0 }, { r: 0, c: 0, d: 1 }], colorIndex: id % 7, kind: 'triangle' };
}

/** A 2-cell region tiled by two unit squares. */
function twoCellPuzzle(): Puzzle {
  const region = [...CELL(0, 0), ...CELL(1, 0)];
  return {
    rows: 2,
    cols: 1,
    backdrop: 'diamond',
    region,
    pieces: [square(0), square(1)],
    solution: [
      { pieceId: 0, tris: CELL(0, 0) },
      { pieceId: 1, tris: CELL(1, 0) },
    ],
    seed: 1,
  };
}

function start(puzzle: Puzzle): GameState {
  return reducer(initialState, { type: 'START', difficulty: DIFFICULTIES.easy, puzzle, now: 0 });
}

describe('orientedTris', () => {
  it('applies rotation then flip', () => {
    const tp = { piece: half(0), rot: 1 as const, flipped: false, placedAt: null };
    expect(orientedTris(tp)).toHaveLength(2);
  });
});

describe('reducer', () => {
  it('START enters playing with all pieces in the tray', () => {
    const s = start(twoCellPuzzle());
    expect(s.phase).toBe('playing');
    expect(s.tray).toHaveLength(2);
    expect(s.tray.every((t) => t.placedAt === null)).toBe(true);
    expect(Object.keys(s.occupied)).toHaveLength(0);
  });

  it('SELECT sets the selected id', () => {
    const s = reducer(start(twoCellPuzzle()), { type: 'SELECT', id: 1 });
    expect(s.selectedId).toBe(1);
  });

  it('a legal PLACE covers the cell and increments moves', () => {
    const s = reducer(start(twoCellPuzzle()), { type: 'PLACE', id: 0, at: { r: 0, c: 0 } });
    expect(s.moves).toBe(1);
    expect(Object.keys(s.occupied)).toHaveLength(4);
    for (const t of CELL(0, 0)) expect(s.occupied[triKey(t)]).toBe(0);
  });

  it('an illegal PLACE (outside region) increments misplacedAttempts, no corruption', () => {
    const s = reducer(start(twoCellPuzzle()), { type: 'PLACE', id: 0, at: { r: 5, c: 5 } });
    expect(s.misplacedAttempts).toBe(1);
    expect(s.moves).toBe(0);
    expect(Object.keys(s.occupied)).toHaveLength(0);
  });

  it('wins when the whole region is covered', () => {
    let s = start(twoCellPuzzle());
    s = reducer(s, { type: 'PLACE', id: 0, at: { r: 0, c: 0 } });
    expect(s.phase).toBe('playing');
    s = reducer(s, { type: 'PLACE', id: 1, at: { r: 1, c: 0 } });
    expect(s.phase).toBe('won');
    expect(s.result).not.toBeNull();
    expect(s.result!.score).toBeGreaterThanOrEqual(300);
  });

  it('PICKUP frees a placed piece and selects it', () => {
    let s = start(twoCellPuzzle());
    s = reducer(s, { type: 'PLACE', id: 0, at: { r: 0, c: 0 } });
    s = reducer(s, { type: 'PICKUP', id: 0 });
    expect(Object.keys(s.occupied)).toHaveLength(0);
    expect(s.selectedId).toBe(0);
    expect(s.tray[0].placedAt).toBeNull();
  });

  it('ROTATE lifts a placed piece back to the tray and turns it', () => {
    let s = start(twoCellPuzzle());
    s = reducer(s, { type: 'PLACE', id: 0, at: { r: 0, c: 0 } });
    s = reducer(s, { type: 'SELECT', id: 0 });
    s = reducer(s, { type: 'ROTATE' });
    expect(s.tray[0].placedAt).toBeNull();
    expect(s.tray[0].rot).toBe(1);
    expect(Object.keys(s.occupied)).toHaveLength(0);
  });

  it('HINT sets a suggested placement and counts the hint', () => {
    const s = reducer(start(twoCellPuzzle()), { type: 'HINT' });
    expect(s.hint).not.toBeNull();
    expect(s.hintsUsed).toBe(1);
  });

  it('detects a dead end when the remaining region cannot be covered', () => {
    // 1 cell, pieces = a small triangle + a unit square. Placing the small
    // triangle in one quarter strands a 3-tri remainder no square can fill.
    const puzzle: Puzzle = {
      rows: 1,
      cols: 1,
      backdrop: 'diamond',
      region: CELL(0, 0),
      pieces: [{ id: 0, tris: [{ r: 0, c: 0, d: 0 }], colorIndex: 0, kind: 'triangle' }, square(1)],
      solution: [],
      seed: 1,
    };
    let s = start(puzzle);
    s = reducer(s, { type: 'PLACE', id: 0, at: { r: 0, c: 0 } });
    expect(s.deadEnd).toBe(true);
  });

  it('RESTART returns all pieces to the tray', () => {
    let s = start(twoCellPuzzle());
    s = reducer(s, { type: 'PLACE', id: 0, at: { r: 0, c: 0 } });
    s = reducer(s, { type: 'RESTART' });
    expect(Object.keys(s.occupied)).toHaveLength(0);
    expect(s.tray.every((t) => t.placedAt === null)).toBe(true);
    expect(s.moves).toBe(0);
  });

  it('TICK updates elapsed time only while playing', () => {
    const s = reducer(start(twoCellPuzzle()), { type: 'TICK', now: 5000 });
    expect(s.elapsedMs).toBe(5000);
    expect(reducer(initialState, { type: 'TICK', now: 5000 }).elapsedMs).toBe(0);
  });
});
