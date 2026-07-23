import { useCallback, useReducer } from 'react';
import { generatePuzzle } from '../lib/generator';
import { applyPour, canPour, isDeadEnd, isSolved } from '../lib/rules';
import { scoreSort } from '../lib/scoring';
import type { SortResult } from '../lib/scoring';
import { hintMove } from '../lib/solver';
import type { BoardState, DifficultyConfig, Puzzle } from '../lib/types';

/** How many boards we keep for undo. */
const MAX_HISTORY = 50;

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  puzzle: Puzzle | null;
  board: BoardState | null;
  /** Index of the currently lifted/selected source bottle, or null. */
  selected: number | null;
  /** Previous boards, oldest first, bounded to the last MAX_HISTORY. */
  history: BoardState[];
  pours: number;
  hintsUsed: number;
  /** Set by HINT so the UI can flash the suggested move; cleared on next tap. */
  hint: { from: number; to: number } | null;
  deadEnd: boolean;
  result: SortResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; puzzle: Puzzle }
  | { type: 'TAP_BOTTLE'; index: number }
  | { type: 'UNDO' }
  | { type: 'RESTART' }
  | { type: 'HINT' }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  puzzle: null,
  board: null,
  selected: null,
  history: [],
  pours: 0,
  hintsUsed: 0,
  hint: null,
  deadEnd: false,
  result: null,
};

function pushHistory(history: BoardState[], board: BoardState): BoardState[] {
  const next = [...history, board];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

/** Pure reducer for the potion-sort game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        board: action.puzzle.board,
        selected: null,
        history: [],
        pours: 0,
        hintsUsed: 0,
        hint: null,
        deadEnd: isDeadEnd(action.puzzle.board),
        result: null,
      };
    }

    case 'TAP_BOTTLE': {
      const { board, puzzle } = state;
      if (state.phase !== 'playing' || board === null || puzzle === null) return state;
      const { index } = action;
      if (index < 0 || index >= board.length) return state;

      // Nothing lifted yet: lift a non-empty bottle.
      if (state.selected === null) {
        if (board[index].length === 0) return state;
        return { ...state, selected: index, hint: null };
      }

      // Tapping the lifted bottle puts it back down.
      if (state.selected === index) {
        return { ...state, selected: null, hint: null };
      }

      if (canPour(board[state.selected], board[index])) {
        const nextBoard = applyPour(board, state.selected, index);
        const pours = state.pours + 1;
        const won = isSolved(nextBoard);
        return {
          ...state,
          phase: won ? 'won' : 'playing',
          board: nextBoard,
          selected: null,
          hint: null,
          history: pushHistory(state.history, board),
          pours,
          deadEnd: won ? false : isDeadEnd(nextBoard),
          result: won ? scoreSort(pours, puzzle.par, state.hintsUsed) : null,
        };
      }

      // Illegal target: never an error for a kid - just move the selection.
      return {
        ...state,
        selected: board[index].length === 0 ? null : index,
        hint: null,
      };
    }

    case 'UNDO': {
      if (state.phase !== 'playing' || state.history.length === 0) return state;
      const previous = state.history[state.history.length - 1];
      return {
        ...state,
        board: previous,
        history: state.history.slice(0, -1),
        pours: Math.max(0, state.pours - 1),
        selected: null,
        hint: null,
        deadEnd: isDeadEnd(previous),
      };
    }

    case 'RESTART': {
      if (state.puzzle === null) return state;
      return {
        ...state,
        phase: 'playing',
        board: state.puzzle.board,
        history: [],
        pours: 0,
        selected: null,
        hint: null,
        deadEnd: false,
        result: null,
      };
    }

    case 'HINT': {
      if (state.phase !== 'playing' || state.board === null) return state;
      const move = hintMove(state.board);
      if (move === null) return state;
      return { ...state, hint: move, hintsUsed: state.hintsUsed + 1, selected: null };
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
 * React hook wrapping the potion-sort reducer. `start` generates a seeded,
 * verified-solvable puzzle and dispatches START.
 */
export function usePotionSort() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback((difficulty: DifficultyConfig, seed: number = Date.now()) => {
    const puzzle = generatePuzzle(difficulty, seed);
    dispatch({ type: 'START', difficulty, puzzle });
  }, []);

  return { state, dispatch, start };
}
