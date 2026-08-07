import { useCallback, useEffect, useReducer } from 'react';
import { generatePuzzle } from '../lib/generator';
import { findPath } from '../lib/solver';
import { isValidPath, pathWord } from '../lib/path';
import { scoreHunt } from '../lib/scoring';
import type { HuntResult } from '../lib/scoring';
import type { Cell, DifficultyConfig, Puzzle } from '../lib/types';

export type SubmitOutcome = 'found' | 'duplicate' | 'not-a-word' | 'too-short' | 'invalid';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  puzzle: Puzzle | null;
  /** Words the player has found, in discovery order (lowercase). */
  found: string[];
  hintsUsed: number;
  /** Cells of an unfound word being flashed as a hint, or null. */
  hintPath: Cell[] | null;
  /** Outcome of the most recent submit + a bump counter, for transient UI. */
  lastOutcome: SubmitOutcome | null;
  outcomeSeq: number;
  elapsedMs: number;
  startTime: number;
  result: HuntResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; puzzle: Puzzle; now: number }
  | { type: 'SUBMIT'; path: Cell[] }
  | { type: 'HINT' }
  | { type: 'CLEAR_HINT' }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  puzzle: null,
  found: [],
  hintsUsed: 0,
  hintPath: null,
  lastOutcome: null,
  outcomeSeq: 0,
  elapsedMs: 0,
  startTime: 0,
  result: null,
};

function withOutcome(state: GameState, outcome: SubmitOutcome, patch: Partial<GameState> = {}): GameState {
  return { ...state, ...patch, lastOutcome: outcome, outcomeSeq: state.outcomeSeq + 1 };
}

/** Pure reducer for the word-hunt game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      return {
        ...initialState,
        phase: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        startTime: action.now,
      };
    }

    case 'SUBMIT': {
      if (state.phase !== 'playing' || state.puzzle === null || state.difficulty === null) {
        return state;
      }
      const { grid, size, minWordLen, solutions } = state.puzzle;
      if (!isValidPath(action.path, size)) return withOutcome(state, 'invalid');

      const word = pathWord(action.path, grid);
      if (word.length < minWordLen) return withOutcome(state, 'too-short');
      if (state.found.includes(word)) return withOutcome(state, 'duplicate');
      if (!solutions.includes(word)) return withOutcome(state, 'not-a-word');

      const found = [...state.found, word];
      const won = found.length >= state.difficulty.targetWords;
      if (won) {
        const result = scoreHunt(state.elapsedMs, state.difficulty.targetWords, state.hintsUsed);
        return withOutcome(state, 'found', { found, hintPath: null, phase: 'won', result });
      }
      return withOutcome(state, 'found', { found, hintPath: null });
    }

    case 'HINT': {
      if (state.phase !== 'playing' || state.puzzle === null) return state;
      const foundSet = new Set(state.found);
      const target = state.puzzle.solutions.find((w) => !foundSet.has(w));
      if (target === undefined) return state;
      const path = findPath(state.puzzle.grid, target);
      if (path === null) return state;
      return { ...state, hintPath: path, hintsUsed: state.hintsUsed + 1 };
    }

    case 'CLEAR_HINT': {
      return state.hintPath === null ? state : { ...state, hintPath: null };
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
 * React hook wrapping the word-hunt reducer. Ticks elapsed time while playing
 * and exposes a `start` helper that generates a seeded board for the chosen
 * difficulty and dispatches START.
 */
export function useWordHunt() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.phase]);

  const start = useCallback((difficulty: DifficultyConfig, seed: number = Date.now()) => {
    const puzzle = generatePuzzle(difficulty, seed);
    dispatch({ type: 'START', difficulty, puzzle, now: Date.now() });
  }, []);

  return { state, dispatch, start };
}
