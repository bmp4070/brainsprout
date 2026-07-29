import { useCallback, useReducer } from 'react';
import { generateRound } from '../lib/problems';
import { scoreRound } from '../lib/scoring';
import type { RoundResult } from '../lib/scoring';
import { ROUND_LENGTH } from '../lib/types';
import type { DifficultyConfig, OperationId, Problem } from '../lib/types';

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  operation: OperationId | null;
  difficulty: DifficultyConfig | null;
  problems: Problem[];
  /** Current question index, 0..ROUND_LENGTH-1 while playing. */
  index: number;
  /** Chosen choice index for the current question, or null if unanswered. */
  selected: number | null;
  correctCount: number;
  streak: number;
  bestStreak: number;
  result: RoundResult | null;
}

export type Action =
  | { type: 'START'; operation: OperationId; difficulty: DifficultyConfig; problems: Problem[] }
  | { type: 'ANSWER'; choiceIndex: number }
  | { type: 'NEXT' }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  operation: null,
  difficulty: null,
  problems: [],
  index: 0,
  selected: null,
  correctCount: 0,
  streak: 0,
  bestStreak: 0,
  result: null,
};

/** Pure reducer for the Math Sprout game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      return {
        phase: 'playing',
        operation: action.operation,
        difficulty: action.difficulty,
        problems: action.problems,
        index: 0,
        selected: null,
        correctCount: 0,
        streak: 0,
        bestStreak: 0,
        result: null,
      };
    }

    case 'ANSWER': {
      if (state.phase !== 'playing' || state.selected !== null) return state;
      const problem = state.problems[state.index];
      if (!problem) return state;

      const isCorrect = action.choiceIndex === problem.correctIndex;
      const streak = isCorrect ? state.streak + 1 : 0;
      const bestStreak = Math.max(state.bestStreak, streak);

      return {
        ...state,
        selected: action.choiceIndex,
        correctCount: isCorrect ? state.correctCount + 1 : state.correctCount,
        streak,
        bestStreak,
      };
    }

    case 'NEXT': {
      if (state.phase !== 'playing' || state.selected === null) return state;
      const nextIndex = state.index + 1;
      if (nextIndex >= ROUND_LENGTH) {
        return {
          ...state,
          phase: 'won',
          index: nextIndex,
          selected: null,
          result: scoreRound(state.correctCount, state.bestStreak),
        };
      }
      return { ...state, index: nextIndex, selected: null };
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
 * React hook wrapping the Math Sprout reducer. `start` generates a seeded,
 * deterministic round for the chosen operation/difficulty and dispatches START.
 */
export function useMathSprout(): {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  start: (operation: OperationId, difficulty: DifficultyConfig, seed?: number) => void;
} {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback(
    (operation: OperationId, difficulty: DifficultyConfig, seed: number = Date.now()) => {
      const problems = generateRound(operation, difficulty.id, seed);
      dispatch({ type: 'START', operation, difficulty, problems });
    },
    [],
  );

  return { state, dispatch, start };
}
