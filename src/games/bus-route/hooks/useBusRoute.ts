import { useCallback, useReducer } from 'react';
import { routeLength } from '../lib/geometry';
import { generateLayout } from '../lib/layout';
import { optimalRoute } from '../lib/optimal';
import type { OptimalRoute } from '../lib/optimal';
import { scoreRoute } from '../lib/scoring';
import type { RouteResult } from '../lib/scoring';
import type { DifficultyConfig, Layout } from '../lib/types';

export interface GameState {
  phase: 'picking' | 'planning' | 'driving' | 'done';
  difficulty: DifficultyConfig | null;
  layout: Layout | null;
  /** True optimal tour, computed at START but hidden from the UI until done. */
  optimal: OptimalRoute | null;
  /** The player's tapped stop ids, in visit sequence. */
  order: number[];
  /** Scoring outcome, set on ARRIVED. */
  result: RouteResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; layout: Layout; optimal: OptimalRoute }
  | { type: 'TAP_STOP'; id: number }
  | { type: 'CLEAR' }
  | { type: 'GO' }
  | { type: 'ARRIVED' }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  layout: null,
  optimal: null,
  order: [],
  result: null,
};

/** Pure reducer for the bus-route game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      return {
        phase: 'planning',
        difficulty: action.difficulty,
        layout: action.layout,
        optimal: action.optimal,
        order: [],
        result: null,
      };
    }

    case 'TAP_STOP': {
      if (state.phase !== 'planning' || state.layout === null) return state;
      const { order } = state;
      // Tapping the most recently added stop undoes it.
      if (order.length > 0 && order[order.length - 1] === action.id) {
        return { ...state, order: order.slice(0, -1) };
      }
      // Tapping a stop already in the middle of the route does nothing.
      if (order.includes(action.id)) return state;
      // Only real stop ids can be appended.
      const isValid = state.layout.stops.some((s) => s.id === action.id);
      if (!isValid) return state;
      return { ...state, order: [...order, action.id] };
    }

    case 'CLEAR': {
      if (state.phase !== 'planning') return state;
      return { ...state, order: [] };
    }

    case 'GO': {
      if (state.phase !== 'planning' || state.difficulty === null) return state;
      if (state.order.length !== state.difficulty.stopCount) return state;
      return { ...state, phase: 'driving' };
    }

    case 'ARRIVED': {
      if (state.phase !== 'driving' || state.layout === null || state.optimal === null) {
        return state;
      }
      const playerLength = routeLength(
        state.layout.school,
        state.layout.stops,
        state.order,
        true,
      );
      const result = scoreRoute(playerLength, state.optimal.length);
      return { ...state, phase: 'done', result };
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
 * React hook wrapping the bus-route reducer. Exposes a `start` helper that
 * generates a seeded layout, solves the exact optimal tour, and dispatches
 * START.
 */
export function useBusRoute() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback((difficulty: DifficultyConfig, seed: number = Date.now()) => {
    const layout = generateLayout(difficulty, seed);
    const optimal = optimalRoute(layout);
    dispatch({ type: 'START', difficulty, layout, optimal });
  }, []);

  return { state, dispatch, start };
}
