import { describe, expect, it } from 'vitest';
import { initialState, reducer, type GameState } from './useMaze';
import { generateMaze, solve, step } from '../lib/maze';
import {
  DIFFICULTIES,
  DIRECTIONS,
  DIR_BIT,
  cellKey,
  type Cell,
  type Direction,
} from '../lib/types';

/** Finds the direction that moves from `a` to adjacent cell `b`. */
function dirBetween(a: Cell, b: Cell): Direction {
  const dir = DIRECTIONS.find((d) => {
    const s = step(a, d);
    return s.r === b.r && s.c === b.c;
  });
  if (!dir) throw new Error('cells are not adjacent');
  return dir;
}

function startedState(seed: number): GameState {
  const difficulty = DIFFICULTIES.easy;
  const maze = generateMaze(difficulty, seed);
  return reducer(initialState, { type: 'START', difficulty, maze, now: 1000 });
}

describe('maze reducer', () => {
  it('START initializes a playing game at the start cell', () => {
    const state = startedState(1);
    expect(state.phase).toBe('playing');
    expect(state.pos).toEqual({ r: 0, c: 0 });
    expect(state.visited).toEqual([cellKey({ r: 0, c: 0 })]);
    expect(state.moves).toBe(0);
    expect(state.hintsUsed).toBe(0);
    expect(state.hint).toBeNull();
    expect(state.result).toBeNull();
  });

  it('MOVE through an open passage updates pos, moves, and visited', () => {
    const state = startedState(2);
    const path = solve(state.maze!, state.pos);
    const dir = dirBetween(path[0], path[1]);
    const next = reducer(state, { type: 'MOVE', dir });
    expect(next.pos).toEqual(path[1]);
    expect(next.moves).toBe(1);
    expect(next.visited).toContain(cellKey(path[1]));
    expect(next.visited).toHaveLength(2);
  });

  it('MOVE into a wall is a no-op', () => {
    const state = startedState(3);
    // Find a wall direction from the start cell (in bounds but closed).
    const wallDir = DIRECTIONS.find((d) => {
      const s = step(state.pos, d);
      const inBounds =
        s.r >= 0 && s.r < state.maze!.rows && s.c >= 0 && s.c < state.maze!.cols;
      return inBounds && (state.maze!.open[0][0] & DIR_BIT[d]) === 0;
    });
    // Fall back to an out-of-bounds direction if the corner has no interior wall.
    const dir: Direction = wallDir ?? 'up';
    const next = reducer(state, { type: 'MOVE', dir });
    expect(next).toBe(state);
  });

  it('does not duplicate a revisited cell in the breadcrumb trail', () => {
    let state = startedState(4);
    const path = solve(state.maze!, state.pos);
    // Move forward one step, then back to start.
    const forward = dirBetween(path[0], path[1]);
    state = reducer(state, { type: 'MOVE', dir: forward });
    const back = dirBetween(path[1], path[0]);
    const backState = reducer(state, { type: 'MOVE', dir: back });
    expect(backState.pos).toEqual({ r: 0, c: 0 });
    expect(backState.moves).toBe(2);
    // start already in visited, so length stays at 2.
    expect(backState.visited).toHaveLength(2);
  });

  it('reaching the goal transitions to won with a result', () => {
    let state = startedState(5);
    const path = solve(state.maze!, state.maze!.start);
    for (let i = 0; i < path.length - 1; i++) {
      const dir = dirBetween(path[i], path[i + 1]);
      state = reducer(state, { type: 'MOVE', dir });
    }
    expect(state.phase).toBe('won');
    expect(state.pos).toEqual(state.maze!.goal);
    expect(state.result).not.toBeNull();
    // Followed the optimal path with no hints -> 3 stars.
    expect(state.result!.stars).toBe(3);
  });

  it('HINT sets hint to the next cell on the shortest path and counts it', () => {
    const state = startedState(6);
    const path = solve(state.maze!, state.pos);
    const hinted = reducer(state, { type: 'HINT' });
    expect(hinted.hint).toEqual(path[1]);
    expect(hinted.hintsUsed).toBe(1);
  });

  it('a used hint forbids a 3-star finish', () => {
    let state = startedState(7);
    state = reducer(state, { type: 'HINT' });
    const path = solve(state.maze!, state.maze!.start);
    for (let i = 0; i < path.length - 1; i++) {
      const dir = dirBetween(path[i], path[i + 1]);
      state = reducer(state, { type: 'MOVE', dir });
    }
    expect(state.phase).toBe('won');
    expect(state.result!.stars).toBeLessThan(3);
  });

  it('MOVE clears an active hint', () => {
    let state = startedState(8);
    state = reducer(state, { type: 'HINT' });
    expect(state.hint).not.toBeNull();
    const path = solve(state.maze!, state.pos);
    const dir = dirBetween(path[0], path[1]);
    state = reducer(state, { type: 'MOVE', dir });
    expect(state.hint).toBeNull();
  });

  it('TICK updates elapsedMs while playing', () => {
    const state = startedState(9);
    const ticked = reducer(state, { type: 'TICK', now: 4000 });
    expect(ticked.elapsedMs).toBe(3000); // startTime was 1000
  });

  it('RESET returns to the initial picking state', () => {
    const state = startedState(10);
    expect(reducer(state, { type: 'RESET' })).toEqual(initialState);
  });

  it('ignores actions when not playing', () => {
    expect(reducer(initialState, { type: 'MOVE', dir: 'down' })).toBe(initialState);
    expect(reducer(initialState, { type: 'HINT' })).toBe(initialState);
    expect(reducer(initialState, { type: 'TICK', now: 5 })).toBe(initialState);
  });
});
