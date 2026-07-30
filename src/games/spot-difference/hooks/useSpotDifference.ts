import { useCallback, useEffect, useReducer } from 'react';
import { generatePuzzle } from '../lib/generator';
import { differenceAt } from '../lib/hittest';
import { getNextTheme } from '../lib/rotation';
import { scoreSpot } from '../lib/scoring';
import type { SpotResult } from '../lib/scoring';
import type { DifficultyConfig, Puzzle } from '../lib/types';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  puzzle: Puzzle | null;
  /** Ids of differences the player has found. */
  found: string[];
  wrongTaps: number;
  /** Difference id being flashed by a hint, or null. */
  hint: string | null;
  hintsUsed: number;
  /** Last wrong-tap location (scene coords) for a UI "nope" shake, or null. */
  lastMiss: { x: number; y: number } | null;
  elapsedMs: number;
  startTime: number;
  result: SpotResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; puzzle: Puzzle; now: number }
  | { type: 'TAP'; x: number; y: number }
  | { type: 'HINT' }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  puzzle: null,
  found: [],
  wrongTaps: 0,
  hint: null,
  hintsUsed: 0,
  lastMiss: null,
  elapsedMs: 0,
  startTime: 0,
  result: null,
};

/** Pure reducer for the spot-the-difference game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        found: [],
        wrongTaps: 0,
        hint: null,
        hintsUsed: 0,
        lastMiss: null,
        elapsedMs: 0,
        startTime: action.now,
        result: null,
      };
    }

    case 'TAP': {
      if (state.phase !== 'playing' || state.puzzle === null || state.difficulty === null) {
        return state;
      }
      const foundSet = new Set(state.found);
      const hit = differenceAt(state.puzzle.differences, foundSet, action.x, action.y);
      if (hit === null) {
        // A miss never fails the round; it just counts toward accuracy scoring.
        return {
          ...state,
          wrongTaps: state.wrongTaps + 1,
          lastMiss: { x: action.x, y: action.y },
        };
      }
      const found = [...state.found, hit.id];
      const won = found.length === state.difficulty.diffCount;
      if (won) {
        const result = scoreSpot(
          state.elapsedMs,
          state.difficulty.diffCount,
          state.wrongTaps,
          state.hintsUsed,
        );
        return { ...state, found, hint: null, lastMiss: null, phase: 'won', result };
      }
      return { ...state, found, hint: null, lastMiss: null };
    }

    case 'HINT': {
      if (state.phase !== 'playing' || state.puzzle === null) return state;
      const foundSet = new Set(state.found);
      const target = state.puzzle.differences.find((d) => !foundSet.has(d.id));
      if (target === undefined) return state;
      return { ...state, hint: target.id, hintsUsed: state.hintsUsed + 1 };
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
 * React hook wrapping the spot-the-difference reducer. Ticks elapsed time while
 * playing and exposes a `start` helper that generates a seeded puzzle for the
 * chosen difficulty/theme and dispatches START.
 */
export function useSpotDifference() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.phase]);

  const start = useCallback(
    (difficulty: DifficultyConfig, seed: number = Date.now(), themeId: string = getNextTheme().id) => {
      const puzzle = generatePuzzle(difficulty, seed, themeId);
      dispatch({ type: 'START', difficulty, puzzle, now: Date.now() });
    },
    [],
  );

  return { state, dispatch, start };
}
