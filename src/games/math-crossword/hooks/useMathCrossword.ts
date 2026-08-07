import { useCallback, useEffect, useReducer } from 'react';
import { generatePuzzle } from '../lib/generator';
import { scoreCrossword } from '../lib/scoring';
import type { CrosswordResult } from '../lib/scoring';
import type { DifficultyConfig, Puzzle } from '../lib/types';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  puzzle: Puzzle | null;
  /** blankId -> the value the player has locked in (correct answers only). */
  solved: Record<number, number>;
  /** The blank the player is currently answering, or null. */
  activeBlankId: number | null;
  mistakes: number;
  hintsUsed: number;
  /** Bumped on each wrong tap so the UI can flash; carries the bad choice. */
  wrongSeq: number;
  wrongChoiceIndex: number | null;
  elapsedMs: number;
  startTime: number;
  result: CrosswordResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; puzzle: Puzzle; now: number }
  | { type: 'SELECT'; blankId: number }
  | { type: 'ANSWER'; blankId: number; choiceIndex: number }
  | { type: 'HINT' }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  puzzle: null,
  solved: {},
  activeBlankId: null,
  mistakes: 0,
  hintsUsed: 0,
  wrongSeq: 0,
  wrongChoiceIndex: null,
  elapsedMs: 0,
  startTime: 0,
  result: null,
};

function checkWin(state: GameState, solved: Record<number, number>): GameState {
  if (state.puzzle === null || state.difficulty === null) return { ...state, solved };
  const allSolved = state.puzzle.blanks.every((b) => solved[b.id] !== undefined);
  if (!allSolved) return { ...state, solved };
  const result = scoreCrossword(
    state.elapsedMs,
    state.puzzle.blanks.length,
    state.mistakes,
    state.hintsUsed,
  );
  return { ...state, solved, activeBlankId: null, phase: 'won', result };
}

/** Pure reducer for the math-crossword game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      const firstBlank = action.puzzle.blanks[0]?.id ?? null;
      return {
        ...initialState,
        phase: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        activeBlankId: firstBlank,
        startTime: action.now,
      };
    }

    case 'SELECT': {
      if (state.phase !== 'playing') return state;
      if (state.solved[action.blankId] !== undefined) return state; // already done
      return { ...state, activeBlankId: action.blankId };
    }

    case 'ANSWER': {
      if (state.phase !== 'playing' || state.puzzle === null) return state;
      const blank = state.puzzle.blanks.find((b) => b.id === action.blankId);
      if (blank === undefined || state.solved[action.blankId] !== undefined) return state;

      if (action.choiceIndex !== blank.correctIndex) {
        return {
          ...state,
          mistakes: state.mistakes + 1,
          wrongSeq: state.wrongSeq + 1,
          wrongChoiceIndex: action.choiceIndex,
        };
      }
      const solved = { ...state.solved, [action.blankId]: blank.answer };
      // Advance focus to the next still-unsolved blank, if any.
      const nextBlank = state.puzzle.blanks.find(
        (b) => b.id !== action.blankId && solved[b.id] === undefined,
      );
      const advanced: GameState = {
        ...state,
        activeBlankId: nextBlank?.id ?? null,
        wrongChoiceIndex: null,
      };
      return checkWin(advanced, solved);
    }

    case 'HINT': {
      if (state.phase !== 'playing' || state.puzzle === null) return state;
      // Solve the active blank (or the first unsolved one) for free.
      const target =
        state.puzzle.blanks.find((b) => b.id === state.activeBlankId && state.solved[b.id] === undefined) ??
        state.puzzle.blanks.find((b) => state.solved[b.id] === undefined);
      if (target === undefined) return state;
      const solved = { ...state.solved, [target.id]: target.answer };
      const nextBlank = state.puzzle.blanks.find(
        (b) => b.id !== target.id && solved[b.id] === undefined,
      );
      const advanced: GameState = {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        activeBlankId: nextBlank?.id ?? null,
        wrongChoiceIndex: null,
      };
      return checkWin(advanced, solved);
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
 * React hook wrapping the math-crossword reducer. Ticks elapsed time while
 * playing and exposes a `start` helper that generates a seeded puzzle for the
 * chosen difficulty and dispatches START.
 */
export function useMathCrossword() {
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
