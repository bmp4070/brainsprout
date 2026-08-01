import { useCallback, useEffect, useReducer } from 'react';
import { generateRound } from '../lib/generator';
import { scoreMemory } from '../lib/scoring';
import type { MemoryResult } from '../lib/scoring';
import type { DifficultyConfig, Round } from '../lib/types';

export interface GameState {
  phase: 'picking' | 'study' | 'recall' | 'won';
  difficulty: DifficultyConfig | null;
  round: Round | null;
  /** Milliseconds left on the study countdown. */
  studyMsLeft: number;
  studyMsTotal: number;
  studyStart: number;
  /** Target item ids the player has correctly caught. */
  found: string[];
  wrongTaps: number;
  /** Item id of the most recent wrong tap + a bump counter, for a UI shake. */
  lastWrong: string | null;
  wrongSeq: number;
  /** Recall timer. */
  elapsedMs: number;
  recallStart: number;
  result: MemoryResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; round: Round; now: number }
  | { type: 'STUDY_TICK'; now: number }
  | { type: 'READY'; now: number }
  | { type: 'TAP'; itemId: string; now: number }
  | { type: 'RECALL_TICK'; now: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  round: null,
  studyMsLeft: 0,
  studyMsTotal: 0,
  studyStart: 0,
  found: [],
  wrongTaps: 0,
  lastWrong: null,
  wrongSeq: 0,
  elapsedMs: 0,
  recallStart: 0,
  result: null,
};

/** Moves from study into the recall phase, starting the recall timer at `now`. */
function beginRecall(state: GameState, now: number): GameState {
  return { ...state, phase: 'recall', studyMsLeft: 0, elapsedMs: 0, recallStart: now };
}

/** Pure reducer for the memory-belt game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      const totalMs = action.round.difficulty.studySeconds * 1000;
      return {
        ...initialState,
        phase: 'study',
        difficulty: action.difficulty,
        round: action.round,
        studyMsLeft: totalMs,
        studyMsTotal: totalMs,
        studyStart: action.now,
      };
    }

    case 'STUDY_TICK': {
      if (state.phase !== 'study') return state;
      const left = Math.max(0, state.studyMsTotal - (action.now - state.studyStart));
      if (left <= 0) return beginRecall(state, action.now);
      return { ...state, studyMsLeft: left };
    }

    case 'READY': {
      if (state.phase !== 'study') return state;
      return beginRecall(state, action.now);
    }

    case 'TAP': {
      if (state.phase !== 'recall' || state.round === null || state.difficulty === null) {
        return state;
      }
      const isTarget = state.round.targetIds.includes(action.itemId);
      if (!isTarget) {
        // Tapping a decoy (or an unstudied item) never fails the round; it just
        // costs accuracy points.
        return {
          ...state,
          wrongTaps: state.wrongTaps + 1,
          lastWrong: action.itemId,
          wrongSeq: state.wrongSeq + 1,
        };
      }
      if (state.found.includes(action.itemId)) return state; // already caught
      const found = [...state.found, action.itemId];
      const won = found.length === state.round.targetIds.length;
      if (won) {
        const result = scoreMemory(state.elapsedMs, state.round.targetIds.length, state.wrongTaps);
        return { ...state, found, phase: 'won', result };
      }
      return { ...state, found };
    }

    case 'RECALL_TICK': {
      if (state.phase !== 'recall') return state;
      return { ...state, elapsedMs: Math.max(0, action.now - state.recallStart) };
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

const TICK_INTERVAL_MS = 200;

/**
 * React hook wrapping the memory-belt reducer. Ticks the study countdown while
 * studying and the recall timer while recalling (one interval, keyed on phase),
 * and exposes a `start` helper that builds a seeded round for the chosen
 * difficulty and dispatches START.
 */
export function useMemoryBelt() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase === 'study') {
      const interval = setInterval(() => dispatch({ type: 'STUDY_TICK', now: Date.now() }), TICK_INTERVAL_MS);
      return () => clearInterval(interval);
    }
    if (state.phase === 'recall') {
      const interval = setInterval(() => dispatch({ type: 'RECALL_TICK', now: Date.now() }), TICK_INTERVAL_MS);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [state.phase]);

  const start = useCallback((difficulty: DifficultyConfig, seed: number = Date.now()) => {
    const round = generateRound(difficulty, seed);
    dispatch({ type: 'START', difficulty, round, now: Date.now() });
  }, []);

  return { state, dispatch, start };
}
