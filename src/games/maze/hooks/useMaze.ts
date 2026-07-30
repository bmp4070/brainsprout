import { useCallback, useEffect, useReducer } from 'react';
import { canMove, generateMaze, solve, step } from '../lib/maze';
import { scoreMaze, type MazeResult } from '../lib/scoring';
import {
  cellKey,
  type Cell,
  type DifficultyConfig,
  type Direction,
  type Maze,
} from '../lib/types';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  maze: Maze | null;
  pos: Cell; // current cell
  visited: string[]; // cellKeys visited, in order (breadcrumb trail)
  moves: number;
  hint: Cell | null; // the next cell to move to (from a hint), or null
  hintsUsed: number;
  elapsedMs: number;
  startTime: number;
  result: MazeResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; maze: Maze; now: number }
  | { type: 'MOVE'; dir: Direction }
  | { type: 'HINT' }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  maze: null,
  pos: { r: 0, c: 0 },
  visited: [],
  moves: 0,
  hint: null,
  hintsUsed: 0,
  elapsedMs: 0,
  startTime: 0,
  result: null,
};

function sameCell(a: Cell, b: Cell): boolean {
  return a.r === b.r && a.c === b.c;
}

/** Pure reducer for the maze game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      const { maze } = action;
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        maze,
        pos: maze.start,
        visited: [cellKey(maze.start)],
        moves: 0,
        hint: null,
        hintsUsed: 0,
        elapsedMs: 0,
        startTime: action.now,
        result: null,
      };
    }

    case 'MOVE': {
      if (state.phase !== 'playing' || !state.maze) return state;
      if (!canMove(state.maze, state.pos, action.dir)) return state;

      const pos = step(state.pos, action.dir);
      const key = cellKey(pos);
      const visited = state.visited.includes(key)
        ? state.visited
        : [...state.visited, key];
      const moves = state.moves + 1;

      if (sameCell(pos, state.maze.goal)) {
        const optimalLength = solve(state.maze, state.maze.start).length - 1;
        const result = scoreMaze(moves, optimalLength, state.hintsUsed);
        return {
          ...state,
          pos,
          visited,
          moves,
          hint: null,
          phase: 'won',
          result,
        };
      }

      return { ...state, pos, visited, moves, hint: null };
    }

    case 'HINT': {
      if (state.phase !== 'playing' || !state.maze) return state;
      const path = solve(state.maze, state.pos);
      if (path.length < 2) return state;
      return {
        ...state,
        hint: path[1],
        hintsUsed: state.hintsUsed + 1,
      };
    }

    case 'TICK': {
      if (state.phase !== 'playing') return state;
      return { ...state, elapsedMs: Math.max(0, action.now - state.startTime) };
    }

    case 'RESET': {
      return initialState;
    }

    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

const TICK_INTERVAL_MS = 250;

/**
 * React hook wrapping the maze reducer. Ticks elapsed time while playing and
 * exposes a `start` helper that generates a maze for the chosen
 * difficulty/seed and dispatches START.
 */
export function useMaze() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.phase]);

  const start = useCallback(
    (difficulty: DifficultyConfig, seed: number = Date.now()) => {
      const maze = generateMaze(difficulty, seed);
      dispatch({ type: 'START', difficulty, maze, now: Date.now() });
    },
    [],
  );

  return { state, dispatch, start };
}
