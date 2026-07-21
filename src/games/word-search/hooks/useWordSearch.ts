import { useCallback, useEffect, useReducer } from 'react';
import { generatePuzzle } from '../lib/generator';
import { matchSelection, snapLine } from '../lib/selection';
import type {
  CellPos,
  DifficultyConfig,
  Puzzle,
  WordTheme,
} from '../lib/types';

export interface FoundWord {
  word: string;
  cells: CellPos[];
  colorIndex: number;
}

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  puzzle: Puzzle | null;
  found: FoundWord[];
  selection: { anchor: CellPos; current: CellPos } | null;
  startTime: number;
  elapsedMs: number;
  hintCell: CellPos | null;
  hintsUsed: number;
  score: number;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; puzzle: Puzzle; now: number }
  | { type: 'SELECT_START'; cell: CellPos }
  | { type: 'SELECT_MOVE'; cell: CellPos }
  | { type: 'SELECT_END' }
  | { type: 'HINT'; now?: number }
  | { type: 'CLEAR_HINT' }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' };

const HINT_PENALTY = 25;
const WORD_SCORE = 100;
const MAX_TIME_BONUS = 300;
const COLOR_COUNT = 6;

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  puzzle: null,
  found: [],
  selection: null,
  startTime: 0,
  elapsedMs: 0,
  hintCell: null,
  hintsUsed: 0,
  score: 0,
};

function computeScore(
  wordsFound: number,
  elapsedMs: number,
  hintsUsed: number,
): number {
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const timeBonus = Math.max(0, MAX_TIME_BONUS - elapsedSeconds);
  const raw = wordsFound * WORD_SCORE + timeBonus - hintsUsed * HINT_PENALTY;
  return Math.max(0, raw);
}

/** Pure reducer for the word-search game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        found: [],
        selection: null,
        startTime: action.now,
        elapsedMs: 0,
        hintCell: null,
        hintsUsed: 0,
        score: 0,
      };
    }

    case 'SELECT_START': {
      if (state.phase !== 'playing') return state;
      return {
        ...state,
        selection: { anchor: action.cell, current: action.cell },
        hintCell: null,
      };
    }

    case 'SELECT_MOVE': {
      if (state.phase !== 'playing' || !state.selection) return state;
      return {
        ...state,
        selection: { ...state.selection, current: action.cell },
      };
    }

    case 'SELECT_END': {
      if (state.phase !== 'playing' || !state.selection || !state.puzzle) {
        return state;
      }
      const cells = snapLine(
        state.selection.anchor,
        state.selection.current,
        state.puzzle.size,
      );
      const foundWordsSet = new Set(state.found.map((f) => f.word));
      const match = matchSelection(cells, state.puzzle.placements, foundWordsSet);

      if (!match) {
        return { ...state, selection: null };
      }

      const newFound: FoundWord = {
        word: match.word,
        cells: match.cells,
        colorIndex: state.found.length % COLOR_COUNT,
      };
      const found = [...state.found, newFound];
      const wonNow = found.length === state.puzzle.placements.length;

      if (!wonNow) {
        return { ...state, selection: null, found };
      }

      const score = computeScore(found.length, state.elapsedMs, state.hintsUsed);
      return { ...state, selection: null, found, phase: 'won', score };
    }

    case 'HINT': {
      if (state.phase !== 'playing' || !state.puzzle) return state;
      const foundWordsSet = new Set(state.found.map((f) => f.word));
      const nextPlacement = state.puzzle.placements.find(
        (p) => !foundWordsSet.has(p.word),
      );
      if (!nextPlacement) return state;
      return {
        ...state,
        hintCell: nextPlacement.cells[0],
        hintsUsed: state.hintsUsed + 1,
      };
    }

    case 'CLEAR_HINT': {
      return { ...state, hintCell: null };
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
 * React hook wrapping the word-search reducer. Ticks the elapsed time while
 * playing, and exposes a `start` helper that generates a puzzle from `theme`
 * for the chosen difficulty/seed and dispatches START.
 */
export function useWordSearch(theme: WordTheme) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.phase]);

  const start = useCallback(
    (
      difficulty: DifficultyConfig,
      seed: number = Date.now(),
      overrideTheme?: WordTheme,
    ) => {
      const puzzle = generatePuzzle(overrideTheme ?? theme, difficulty, seed);
      dispatch({ type: 'START', difficulty, puzzle, now: Date.now() });
    },
    [theme],
  );

  return { state, dispatch, start };
}
