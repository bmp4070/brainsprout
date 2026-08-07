import { useCallback, useEffect, useReducer } from 'react';
import { scoreDrop } from '../lib/scoring';
import type { DropResult } from '../lib/scoring';
import type { DifficultyConfig } from '../lib/types';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  filled: number;
  misses: number;
  /** Bumped on each drop so the UI can flash hit/miss feedback. */
  dropSeq: number;
  lastDrop: 'hit' | 'miss' | null;
  elapsedMs: number;
  startTime: number;
  result: DropResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; now: number }
  | { type: 'HIT'; now: number }
  | { type: 'MISS' }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  filled: 0,
  misses: 0,
  dropSeq: 0,
  lastDrop: null,
  elapsedMs: 0,
  startTime: 0,
  result: null,
};

/** Pure reducer for the straw-drop game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      return {
        ...initialState,
        phase: 'playing',
        difficulty: action.difficulty,
        startTime: action.now,
      };
    }

    case 'HIT': {
      if (state.phase !== 'playing' || state.difficulty === null) return state;
      const filled = state.filled + 1;
      const won = filled >= state.difficulty.target;
      if (won) {
        const result = scoreDrop(state.elapsedMs, state.difficulty.target, state.misses);
        return { ...state, filled, dropSeq: state.dropSeq + 1, lastDrop: 'hit', phase: 'won', result };
      }
      return { ...state, filled, dropSeq: state.dropSeq + 1, lastDrop: 'hit' };
    }

    case 'MISS': {
      if (state.phase !== 'playing') return state;
      return { ...state, misses: state.misses + 1, dropSeq: state.dropSeq + 1, lastDrop: 'miss' };
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
 * React hook wrapping the straw-drop reducer. Ticks elapsed time while playing
 * and exposes a `start` helper. The real-time belt/straw simulation runs in the
 * PlayField component and dispatches HIT / MISS as drops resolve.
 */
export function useStrawDrop() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.phase]);

  const start = useCallback((difficulty: DifficultyConfig) => {
    dispatch({ type: 'START', difficulty, now: Date.now() });
  }, []);

  return { state, dispatch, start };
}
