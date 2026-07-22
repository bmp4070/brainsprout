import { useCallback, useReducer } from 'react';
import { generatePattern, patternLoopDuration } from '../lib/pattern';
import type { Segment } from '../lib/pattern';
import { BACKSLIDE_FACTOR, SPEED_PER_MS } from '../lib/constants';
import type { DifficultyConfig } from '../lib/types';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  pattern: Segment[] | null;
  /** Sum of all segment durations, for the elapsedMs % patternLoopMs index. */
  patternLoopMs: number;
  elapsedMs: number;
  /** 0..totalDistance */
  position: number;
  /** Whether the player is currently holding the row control. */
  rowing: boolean;
  /** Total ms spent rowing correctly (row segment + rowing). */
  correctMs: number;
  /** Total ms spent rowing during a rest segment. */
  wrongMs: number;
  /** Total ms of row segments where the player was NOT rowing. */
  missedMs: number;
  score: number;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; seed: number }
  | { type: 'ROW_START' }
  | { type: 'ROW_END' }
  | { type: 'TICK'; deltaMs: number }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  pattern: null,
  patternLoopMs: 0,
  elapsedMs: 0,
  position: 0,
  rowing: false,
  correctMs: 0,
  wrongMs: 0,
  missedMs: 0,
  score: 0,
};

/**
 * Finds the segment active at `elapsedMs`, looping the pattern every
 * `patternLoopMs`. Pure and independently testable so the loop-boundary
 * (modulo) math can be verified without going through TICK.
 */
export function segmentAt(pattern: Segment[], patternLoopMs: number, elapsedMs: number): Segment {
  return pattern[segmentIndexAt(pattern, patternLoopMs, elapsedMs)];
}

/**
 * Same lookup as `segmentAt`, but returns the segment's index within
 * `pattern`. Useful for detecting transitions (e.g. "just entered a row
 * segment") across ticks without comparing segment objects by reference.
 */
export function segmentIndexAt(pattern: Segment[], patternLoopMs: number, elapsedMs: number): number {
  if (pattern.length === 0) {
    throw new Error('segmentIndexAt: pattern must not be empty');
  }
  if (patternLoopMs <= 0) return 0;
  const t = ((elapsedMs % patternLoopMs) + patternLoopMs) % patternLoopMs;
  let cumulative = 0;
  for (let i = 0; i < pattern.length; i++) {
    cumulative += pattern[i].durationMs;
    if (t < cumulative) return i;
  }
  return pattern.length - 1;
}

/**
 * Score formula: a 200-point completion bonus (finishing always earns
 * something -- a kid who crosses the fjord shouldn't see a 0), up to 500
 * points for accuracy (the share of active rowing time spent correctly
 * timed), and up to 300 points for speed relative to the difficulty's ideal
 * crossing time (a perfect player finishing in that time gets the full
 * bonus; taking longer tapers it toward 0 rather than going negative).
 * Always in [200, 1000] on a completed crossing.
 */
function computeScore(
  elapsedMs: number,
  correctMs: number,
  wrongMs: number,
  missedMs: number,
  difficulty: DifficultyConfig,
): number {
  const idealMs = difficulty.totalDistance / SPEED_PER_MS;
  const activeMs = correctMs + wrongMs + missedMs;
  const accuracy = activeMs > 0 ? correctMs / activeMs : 1;
  const speed = Math.min(1, idealMs / Math.max(1, elapsedMs));
  const raw = Math.round(200 + 500 * accuracy + 300 * speed);
  return Math.max(0, Math.min(1000, raw));
}

/** Pure reducer for the row-row game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      const pattern = generatePattern(action.difficulty, action.seed);
      return {
        ...initialState,
        phase: 'playing',
        difficulty: action.difficulty,
        pattern,
        patternLoopMs: patternLoopDuration(pattern),
      };
    }

    case 'ROW_START': {
      if (state.phase !== 'playing') return state;
      return { ...state, rowing: true };
    }

    case 'ROW_END': {
      if (state.phase !== 'playing') return state;
      return { ...state, rowing: false };
    }

    case 'TICK': {
      if (state.phase !== 'playing' || !state.pattern || !state.difficulty) return state;
      const { deltaMs } = action;
      const elapsedMs = state.elapsedMs + deltaMs;
      const segment = segmentAt(state.pattern, state.patternLoopMs, elapsedMs);
      const totalDistance = state.difficulty.totalDistance;

      let position = state.position;
      let correctMs = state.correctMs;
      let wrongMs = state.wrongMs;
      let missedMs = state.missedMs;

      if (state.rowing) {
        if (segment.type === 'row') {
          position = Math.min(totalDistance, position + SPEED_PER_MS * deltaMs);
          correctMs += deltaMs;
        } else {
          position = Math.max(0, position - SPEED_PER_MS * BACKSLIDE_FACTOR * deltaMs);
          wrongMs += deltaMs;
        }
      } else if (segment.type === 'row') {
        missedMs += deltaMs;
      }

      const won = position >= totalDistance;
      const phase = won ? 'won' : state.phase;
      const score = won
        ? computeScore(elapsedMs, correctMs, wrongMs, missedMs, state.difficulty)
        : state.score;

      return {
        ...state,
        phase,
        elapsedMs,
        position,
        correctMs,
        wrongMs,
        missedMs,
        score,
      };
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

/**
 * React hook wrapping the row-row reducer, exposing a `start` helper that
 * builds the seeded drum pattern and dispatches START. The animation-frame
 * TICK loop lives in RowRowGame.tsx (it needs `requestAnimationFrame`, not
 * a fixed interval, to track real elapsed time smoothly for the rhythm).
 */
export function useRowRow() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback((difficulty: DifficultyConfig, seed: number = Date.now()) => {
    dispatch({ type: 'START', difficulty, seed });
  }, []);

  return { state, dispatch, start };
}
