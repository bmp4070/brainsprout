import { useCallback, useReducer } from 'react';
import { generatePuzzle } from '../lib/generator';
import { calculateScore } from '../lib/scoring';
import type { WheelResult } from '../lib/scoring';
import type { DifficultyConfig, Puzzle } from '../lib/types';
import { canMake } from '../lib/words';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  puzzle: Puzzle | null;
  selection: number[];
  found: string[];
  revealed: Record<string, number>;
  lastResult: 'none' | 'correct' | 'already' | 'invalid';
  startTime: number;
  hintsUsed: number;
  invalidAttempts: number;
  result: WheelResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; puzzle: Puzzle; now: number }
  | { type: 'TAP_LETTER'; index: number }
  | { type: 'SUBMIT' }
  | { type: 'BACKSPACE' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SHUFFLE'; order: number[] }
  | { type: 'HINT' }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  puzzle: null,
  selection: [],
  found: [],
  revealed: {},
  lastResult: 'none',
  startTime: 0,
  hintsUsed: 0,
  invalidAttempts: 0,
  result: null,
};

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        selection: [],
        found: [],
        revealed: {},
        lastResult: 'none',
        startTime: action.now,
        hintsUsed: 0,
        invalidAttempts: 0,
        result: null,
      };

    case 'RESET':
      return initialState;

    default:
      break;
  }

  if (state.phase !== 'playing' || state.puzzle === null) {
    return state;
  }

  const { puzzle } = state;

  switch (action.type) {
    case 'TAP_LETTER': {
      if (state.selection.includes(action.index)) {
        return state;
      }
      return {
        ...state,
        selection: [...state.selection, action.index],
        lastResult: 'none',
      };
    }

    case 'BACKSPACE': {
      if (state.selection.length === 0) {
        return state;
      }
      return {
        ...state,
        selection: state.selection.slice(0, -1),
        lastResult: 'none',
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        selection: [],
        lastResult: 'none',
      };

    case 'SHUFFLE': {
      const newLetters = action.order.map((i) => puzzle.letters[i] ?? '');
      return {
        ...state,
        puzzle: { ...puzzle, letters: newLetters },
        selection: [],
        lastResult: 'none',
      };
    }

    case 'SUBMIT': {
      if (state.selection.length === 0) {
        return state;
      }

      const word = state.selection.map((i) => puzzle.letters[i]).join('').toLowerCase();
      const spellable = canMake(word, puzzle.letters);
      const isTarget = spellable && puzzle.words.includes(word);
      const alreadyFound = isTarget && state.found.includes(word);

      if (isTarget && !alreadyFound) {
        const nextFound = [...state.found, word];
        const isWon = nextFound.length === puzzle.words.length;
        if (isWon) {
          const elapsedMs = Math.max(0, Date.now() - state.startTime);
          const result = calculateScore(
            elapsedMs,
            puzzle.words.length,
            state.hintsUsed,
            state.invalidAttempts,
            state.difficulty ?? ({ id: 'easy' } as DifficultyConfig),
          );
          return {
            ...state,
            selection: [],
            found: nextFound,
            lastResult: 'correct',
            phase: 'won',
            result,
          };
        }
        return {
          ...state,
          selection: [],
          found: nextFound,
          lastResult: 'correct',
        };
      }

      if (alreadyFound) {
        return {
          ...state,
          selection: [],
          lastResult: 'already',
        };
      }

      return {
        ...state,
        selection: [],
        lastResult: 'invalid',
        invalidAttempts: state.invalidAttempts + 1,
      };
    }

    case 'HINT': {
      const unfound = puzzle.words.filter((w) => !state.found.includes(w));
      if (unfound.length === 0) {
        return state;
      }

      // Pick target word with fewest revealed letters
      let bestWord = unfound[0];
      let minRevealed = state.revealed[bestWord] ?? 0;
      for (let i = 1; i < unfound.length; i++) {
        const rev = state.revealed[unfound[i]] ?? 0;
        if (rev < minRevealed) {
          minRevealed = rev;
          bestWord = unfound[i];
        }
      }

      const current = state.revealed[bestWord] ?? 0;
      if (current >= bestWord.length) {
        return state;
      }

      const nextRevealed = { ...state.revealed, [bestWord]: current + 1 };
      return {
        ...state,
        revealed: nextRevealed,
        hintsUsed: state.hintsUsed + 1,
      };
    }

    default:
      return state;
  }
}

export function useWordWheel() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback((difficulty: DifficultyConfig, seed: number = Date.now()) => {
    const puzzle = generatePuzzle(difficulty, seed);
    dispatch({ type: 'START', difficulty, puzzle, now: Date.now() });
  }, []);

  return { state, dispatch, start };
}
