import { useCallback, useEffect, useReducer } from 'react';
import { generatePieceLayout } from '../lib/pieces';
import type { PieceLayout } from '../lib/pieces';
import { shufflePositions } from '../lib/shuffle';
import type { DifficultyConfig } from '../lib/types';
import { pieceCount } from '../lib/types';
import { getTrayRect } from '../lib/trayLayout';
import type { TrayMode } from '../lib/trayLayout';
import type { JigsawScene } from '../scenes';

export interface PiecePosition {
  /** Fraction (0..1) of the board width, when locked; fraction of the play
   * area otherwise. Represents the piece's bounding-box top-left. */
  xFrac: number;
  yFrac: number;
  rotation: number;
  locked: boolean;
  /** Stacking order among unlocked pieces: higher renders on top. Bumped
   * whenever the piece is picked up, so the pile always digs to the most
   * recently touched piece. */
  zOrder: number;
}

export interface JigsawState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  scene: JigsawScene | null;
  layout: PieceLayout | null;
  /** Indexed [row][col]; null until a game has started. */
  positions: PiecePosition[][] | null;
  dragging: { row: number; col: number } | null;
  lockedCount: number;
  startTime: number;
  elapsedMs: number;
  /** Whether the tray sits below the board or beside it; null until started. */
  trayMode: TrayMode | null;
  /** Next value to hand out for `zOrder` on pickup; always increasing. */
  nextZOrder: number;
}

export type Action =
  | {
      type: 'START';
      difficulty: DifficultyConfig;
      scene: JigsawScene;
      seed: number;
      now: number;
      trayMode: TrayMode;
    }
  | { type: 'PICK_UP'; row: number; col: number }
  | { type: 'MOVE'; row: number; col: number; xFrac: number; yFrac: number }
  | {
      type: 'DROP';
      row: number;
      col: number;
      xFrac: number;
      yFrac: number;
      snapped: boolean;
    }
  | { type: 'TICK'; now: number }
  | { type: 'RESET' }
  | { type: 'RELAYOUT'; trayMode: TrayMode };

export const initialState: JigsawState = {
  phase: 'picking',
  difficulty: null,
  scene: null,
  layout: null,
  positions: null,
  dragging: null,
  lockedCount: 0,
  startTime: 0,
  elapsedMs: 0,
  trayMode: null,
  nextZOrder: 0,
};

/** Linearly remaps `v` from the `[a0, a1]` range into `[b0, b1]`, clamped. */
function remapClamped(v: number, a0: number, a1: number, b0: number, b1: number): number {
  const t = a1 === a0 ? 0.5 : (v - a0) / (a1 - a0);
  const clamped = Math.min(Math.max(t, 0), 1);
  return b0 + clamped * (b1 - b0);
}

/** A piece's home-slot position, as a fraction of the board's width/height. */
function targetFrac(row: number, col: number, difficulty: DifficultyConfig): { xFrac: number; yFrac: number } {
  return { xFrac: col / difficulty.cols, yFrac: row / difficulty.rows };
}

/** Pure reducer for the jigsaw game. Performs no side effects. */
export function reducer(state: JigsawState, action: Action): JigsawState {
  switch (action.type) {
    case 'START': {
      const layout = generatePieceLayout(action.difficulty.rows, action.difficulty.cols, action.seed);
      const count = pieceCount(action.difficulty);
      const trayRect = getTrayRect(action.trayMode);
      const scattered = shufflePositions(count, action.seed, trayRect);
      const positions: PiecePosition[][] = [];
      let i = 0;
      for (let r = 0; r < action.difficulty.rows; r++) {
        const row: PiecePosition[] = [];
        for (let c = 0; c < action.difficulty.cols; c++) {
          const s = scattered[i];
          row.push({
            xFrac: s.xFrac,
            yFrac: s.yFrac,
            rotation: s.rotation,
            locked: false,
            zOrder: i,
          });
          i++;
        }
        positions.push(row);
      }
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        scene: action.scene,
        layout,
        positions,
        dragging: null,
        lockedCount: 0,
        startTime: action.now,
        elapsedMs: 0,
        trayMode: action.trayMode,
        nextZOrder: count,
      };
    }

    case 'PICK_UP': {
      if (state.phase !== 'playing' || !state.positions) return state;
      const piece = state.positions[action.row]?.[action.col];
      if (!piece || piece.locked) return state;
      const positions = state.positions.map((row) => row.slice());
      const nextZOrder = state.nextZOrder + 1;
      positions[action.row][action.col] = { ...piece, rotation: 0, zOrder: nextZOrder };
      return {
        ...state,
        positions,
        dragging: { row: action.row, col: action.col },
        nextZOrder,
      };
    }

    case 'MOVE': {
      if (state.phase !== 'playing' || !state.positions || !state.dragging) return state;
      if (state.dragging.row !== action.row || state.dragging.col !== action.col) return state;
      const piece = state.positions[action.row]?.[action.col];
      if (!piece || piece.locked) return state;
      const positions = state.positions.map((row) => row.slice());
      positions[action.row][action.col] = {
        ...piece,
        xFrac: action.xFrac,
        yFrac: action.yFrac,
        rotation: 0,
      };
      return { ...state, positions };
    }

    case 'DROP': {
      if (state.phase !== 'playing' || !state.positions || !state.difficulty || !state.dragging) {
        return state;
      }
      if (state.dragging.row !== action.row || state.dragging.col !== action.col) return state;
      const piece = state.positions[action.row]?.[action.col];
      if (!piece || piece.locked) return { ...state, dragging: null };

      const positions = state.positions.map((row) => row.slice());
      if (action.snapped) {
        const target = targetFrac(action.row, action.col, state.difficulty);
        positions[action.row][action.col] = {
          xFrac: target.xFrac,
          yFrac: target.yFrac,
          rotation: 0,
          locked: true,
          zOrder: piece.zOrder,
        };
        const lockedCount = state.lockedCount + 1;
        const total = pieceCount(state.difficulty);
        const phase = lockedCount === total ? 'won' : state.phase;
        return { ...state, positions, dragging: null, lockedCount, phase };
      }

      positions[action.row][action.col] = {
        ...piece,
        xFrac: action.xFrac,
        yFrac: action.yFrac,
        rotation: 0,
        locked: false,
      };
      return { ...state, positions, dragging: null };
    }

    case 'TICK': {
      if (state.phase !== 'playing') return state;
      return { ...state, elapsedMs: Math.max(0, action.now - state.startTime) };
    }

    case 'RESET': {
      return initialState;
    }

    case 'RELAYOUT': {
      if (state.phase !== 'playing' || !state.positions || !state.trayMode) return state;
      if (state.trayMode === action.trayMode) return state;
      const oldRect = getTrayRect(state.trayMode);
      const newRect = getTrayRect(action.trayMode);
      // Only pieces actually resting in the old tray move to the new tray;
      // pieces a player has parked on the board stay where they were put.
      const inOldTray = (p: { xFrac: number; yFrac: number }) =>
        p.xFrac >= oldRect.x0 - 0.05 &&
        p.xFrac <= oldRect.x1 + 0.05 &&
        p.yFrac >= oldRect.y0 - 0.05 &&
        p.yFrac <= oldRect.y1 + 0.05 &&
        // The tray never overlaps the board, so anything fully inside the
        // board region is "on the board" even if it grazes the tray margin.
        (p.xFrac > 1 || p.yFrac > 1);
      const positions = state.positions.map((row) =>
        row.map((piece) =>
          piece.locked || !inOldTray(piece)
            ? piece
            : {
                ...piece,
                xFrac: remapClamped(piece.xFrac, oldRect.x0, oldRect.x1, newRect.x0, newRect.x1),
                yFrac: remapClamped(piece.yFrac, oldRect.y0, oldRect.y1, newRect.y0, newRect.y1),
              },
        ),
      );
      return { ...state, positions, trayMode: action.trayMode };
    }

    default: {
      const exhaustiveCheck: never = action;
      return exhaustiveCheck;
    }
  }
}

const TICK_INTERVAL_MS = 250;

/**
 * React hook wrapping the jigsaw reducer. Ticks the elapsed time while
 * playing, and exposes a `start` helper that lays out pieces for the chosen
 * scene/difficulty/seed and dispatches START.
 */
export function useJigsaw() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.phase !== 'playing') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK', now: Date.now() });
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state.phase]);

  const start = useCallback(
    (difficulty: DifficultyConfig, scene: JigsawScene, trayMode: TrayMode, seed: number = Date.now()) => {
      dispatch({ type: 'START', difficulty, scene, seed, now: Date.now(), trayMode });
    },
    [],
  );

  return { state, dispatch, start };
}
