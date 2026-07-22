import { useCallback, useEffect, useReducer } from 'react';
import { findConflicts, regionCatCounts } from '../lib/conflicts';
import { generatePuzzle } from '../lib/generator';
import type { CellMark, DifficultyConfig, Puzzle } from '../lib/types';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  puzzle: Puzzle | null;
  marks: CellMark[][] | null;
  /** cellKeys of CAT cells currently violating any rule. */
  conflicts: ReadonlySet<string>;
  startTime: number;
  elapsedMs: number;
  hintsUsed: number;
  score: number;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; puzzle: Puzzle; now: number }
  | { type: 'CYCLE_CELL'; row: number; col: number }
  | { type: 'HINT' }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' };

const PAR_SECONDS_PER_CELL = 45;

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  puzzle: null,
  marks: null,
  conflicts: new Set<string>(),
  startTime: 0,
  elapsedMs: 0,
  hintsUsed: 0,
  score: 0,
};

/**
 * Score formula (mirrors row-row's structure): a 300-point completion bonus so
 * a kid who finishes never sees a demoralizing score, plus up to 500 points for
 * speed against a par time of `size x 45s` (min(1, par/elapsed) x 500 -- solve
 * at or under par for the full bonus, slower tapers toward 0), plus a 200-point
 * accuracy bonus reduced by 100 per hint used (floored at 0 on that component).
 * Always in [300, 1000] on completion.
 */
function computeScore(elapsedMs: number, hintsUsed: number, size: number): number {
  const parMs = size * PAR_SECONDS_PER_CELL * 1000;
  const speedBonus = Math.min(1, parMs / Math.max(1, elapsedMs)) * 500;
  const accuracyBonus = Math.max(0, 200 - hintsUsed * 100);
  const raw = Math.round(300 + speedBonus + accuracyBonus);
  return Math.max(300, Math.min(1000, raw));
}

/**
 * Applies a new marks grid: recomputes conflicts, and if every region holds
 * exactly one cat with no conflicts, transitions to 'won' with a final score.
 * (The uniqueness guarantee means such a board equals the solution.)
 */
function settle(state: GameState, marks: CellMark[][]): GameState {
  const puzzle = state.puzzle;
  if (puzzle === null) return state;
  const conflicts = findConflicts(marks, puzzle.regions);
  const counts = regionCatCounts(marks, puzzle.regions, puzzle.size);
  const won = conflicts.size === 0 && counts.every((c) => c === 1);
  if (won) {
    const score = computeScore(state.elapsedMs, state.hintsUsed, puzzle.size);
    return { ...state, marks, conflicts, phase: 'won', score };
  }
  return { ...state, marks, conflicts };
}

function cloneMarks(marks: CellMark[][]): CellMark[][] {
  return marks.map((row) => [...row]);
}

/** Pure reducer for the cat-nap game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      const size = action.puzzle.size;
      const marks: CellMark[][] = Array.from({ length: size }, () =>
        new Array<CellMark>(size).fill('empty'),
      );
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        marks,
        conflicts: new Set<string>(),
        startTime: action.now,
        elapsedMs: 0,
        hintsUsed: 0,
        score: 0,
      };
    }

    case 'CYCLE_CELL': {
      if (state.phase !== 'playing' || !state.puzzle || !state.marks) return state;
      const { size } = state.puzzle;
      if (action.row < 0 || action.row >= size || action.col < 0 || action.col >= size) {
        return state;
      }
      const marks = cloneMarks(state.marks);
      const current = marks[action.row][action.col];
      const next: CellMark =
        current === 'empty' ? 'cat' : current === 'cat' ? 'paw' : 'empty';
      marks[action.row][action.col] = next;
      return settle(state, marks);
    }

    case 'HINT': {
      if (state.phase !== 'playing' || !state.puzzle || !state.marks) return state;
      const puzzle = state.puzzle;
      let targetRegion = -1;
      for (let i = 0; i < puzzle.solution.length; i++) {
        const sol = puzzle.solution[i];
        if (state.marks[sol.row][sol.col] !== 'cat') {
          targetRegion = i;
          break;
        }
      }
      if (targetRegion === -1) return state;

      const marks = cloneMarks(state.marks);
      // Clear any wrong cats already in this region, then place the correct one.
      for (let row = 0; row < puzzle.size; row++) {
        for (let col = 0; col < puzzle.size; col++) {
          if (puzzle.regions[row][col] === targetRegion && marks[row][col] === 'cat') {
            marks[row][col] = 'empty';
          }
        }
      }
      const sol = puzzle.solution[targetRegion];
      marks[sol.row][sol.col] = 'cat';

      return settle({ ...state, hintsUsed: state.hintsUsed + 1 }, marks);
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
 * React hook wrapping the cat-nap reducer. Ticks elapsed time while playing and
 * exposes a `start` helper that generates a seeded puzzle for the chosen
 * difficulty and dispatches START.
 */
export function useCatNap() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.phase]);

  const start = useCallback((difficulty: DifficultyConfig, seed: number = Date.now()) => {
    const puzzle = generatePuzzle(difficulty, seed);
    dispatch({ type: 'START', difficulty, puzzle, now: Date.now() });
  }, []);

  return { state, dispatch, start };
}
