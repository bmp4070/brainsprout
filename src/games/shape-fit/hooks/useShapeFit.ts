import { useCallback, useReducer } from 'react';
import { generatePuzzle } from '../lib/generator';
import { scoreFit } from '../lib/scoring';
import type { FitResult } from '../lib/scoring';
import { flipH, normalize, placeAt, rotate90, canPlace } from '../lib/shapes';
import { hintPlacement, isCompletable } from '../lib/solver';
import { DIFFICULTIES } from '../lib/types';
import type { Cell, DifficultyConfig, Piece, Placement, Puzzle } from '../lib/types';

/** Per-tray-piece live orientation + placement. */
export interface TrayPiece {
  piece: Piece;
  rot: 0 | 1 | 2 | 3;
  flipped: boolean;
  /** bbox-top-left on the board, or null if the piece is still in the tray. */
  placedAt: Cell | null;
}

export interface GameState {
  phase: 'picking' | 'playing' | 'won';
  difficulty: DifficultyConfig | null;
  puzzle: Puzzle | null;
  tray: TrayPiece[];
  selectedId: number | null;
  /** cellKey -> pieceId of every covered region cell. */
  occupied: Record<string, number>;
  hint: Placement | null;
  deadEnd: boolean;
  moves: number;
  misplacedAttempts: number;
  hintsUsed: number;
  elapsedMs: number;
  startTime: number;
  result: FitResult | null;
}

export type Action =
  | { type: 'START'; difficulty: DifficultyConfig; puzzle: Puzzle; now: number }
  | { type: 'SELECT'; id: number | null }
  | { type: 'ROTATE' }
  | { type: 'FLIP' }
  | { type: 'PLACE'; id: number; at: Cell }
  | { type: 'PICKUP'; id: number }
  | { type: 'HINT'; now?: number }
  | { type: 'TICK'; now: number }
  | { type: 'RESTART' }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'picking',
  difficulty: null,
  puzzle: null,
  tray: [],
  selectedId: null,
  occupied: {},
  hint: null,
  deadEnd: false,
  moves: 0,
  misplacedAttempts: 0,
  hintsUsed: 0,
  elapsedMs: 0,
  startTime: 0,
  result: null,
};

/** Current oriented + normalized silhouette for a tray piece (rotate, then flip). */
export function orientedCells(trayPiece: TrayPiece): Cell[] {
  let cells = normalize(trayPiece.piece.cells);
  for (let i = 0; i < trayPiece.rot; i += 1) cells = rotate90(cells);
  if (trayPiece.flipped) cells = flipH(cells);
  return cells;
}

/** Total number of region cells (the win target). */
function regionCellCount(puzzle: Puzzle): number {
  let count = 0;
  for (let r = 0; r < puzzle.rows; r += 1) {
    for (let c = 0; c < puzzle.cols; c += 1) {
      if (puzzle.region[r][c]) count += 1;
    }
  }
  return count;
}

/** Set of occupied cell keys, optionally excluding one piece's cells. */
function occupiedSet(occupied: Record<string, number>, excludeId?: number): Set<string> {
  const set = new Set<string>();
  for (const key in occupied) {
    if (excludeId !== undefined && occupied[key] === excludeId) continue;
    set.add(key);
  }
  return set;
}

/** Base pieces still in the tray (not yet placed). */
function remainingPieces(tray: TrayPiece[]): Piece[] {
  return tray.filter((tp) => tp.placedAt === null).map((tp) => tp.piece);
}

/** Recomputes deadEnd: true when unplaced pieces can no longer tile the rest. */
function computeDeadEnd(puzzle: Puzzle, occupied: Record<string, number>, tray: TrayPiece[]): boolean {
  const remaining = remainingPieces(tray);
  if (remaining.length === 0) return false;
  return !isCompletable(puzzle.region, occupiedSet(occupied), remaining);
}

/** Pure reducer for the shape-fit game. Performs no side effects. */
export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START': {
      const tray: TrayPiece[] = action.puzzle.pieces.map((piece) => ({
        piece,
        rot: 0,
        flipped: false,
        placedAt: null,
      }));
      return {
        phase: 'playing',
        difficulty: action.difficulty,
        puzzle: action.puzzle,
        tray,
        selectedId: null,
        occupied: {},
        hint: null,
        deadEnd: false,
        moves: 0,
        misplacedAttempts: 0,
        hintsUsed: 0,
        elapsedMs: 0,
        startTime: action.now,
        result: null,
      };
    }

    case 'RESET':
      return initialState;

    case 'TICK': {
      if (state.phase !== 'playing') return state;
      return { ...state, elapsedMs: Math.max(0, action.now - state.startTime) };
    }

    default:
      break;
  }

  if (state.phase !== 'playing' || state.puzzle === null) return state;
  const puzzle = state.puzzle;

  switch (action.type) {
    case 'SELECT': {
      return { ...state, selectedId: action.id };
    }

    case 'ROTATE':
    case 'FLIP': {
      if (state.selectedId === null) return state;
      const id = state.selectedId;
      const idx = state.tray.findIndex((tp) => tp.piece.id === id);
      if (idx === -1) return state;
      const tp = state.tray[idx];

      // If placed, lift it back to the tray (freeing its cells) before turning.
      let occupied = state.occupied;
      if (tp.placedAt !== null) {
        occupied = { ...state.occupied };
        for (const key in occupied) {
          if (occupied[key] === id) delete occupied[key];
        }
      }
      const nextTp: TrayPiece = {
        ...tp,
        placedAt: null,
        rot: action.type === 'ROTATE' ? (((tp.rot + 1) % 4) as 0 | 1 | 2 | 3) : tp.rot,
        flipped: action.type === 'FLIP' ? !tp.flipped : tp.flipped,
      };
      const tray = [...state.tray];
      tray[idx] = nextTp;
      return {
        ...state,
        tray,
        occupied,
        hint: null,
        deadEnd: computeDeadEnd(puzzle, occupied, tray),
      };
    }

    case 'PLACE': {
      const { id, at } = action;
      const idx = state.tray.findIndex((tp) => tp.piece.id === id);
      if (idx === -1) return { ...state, hint: null };
      const tp = state.tray[idx];
      const abs = placeAt(orientedCells(tp), at.r, at.c);
      const occExcluding = occupiedSet(state.occupied, id);

      if (!canPlace(puzzle.region, occExcluding, abs)) {
        return { ...state, misplacedAttempts: state.misplacedAttempts + 1, hint: null };
      }

      const occupied: Record<string, number> = {};
      for (const key in state.occupied) {
        if (state.occupied[key] !== id) occupied[key] = state.occupied[key];
      }
      for (const cell of abs) occupied[`${cell.r},${cell.c}`] = id;

      const tray = [...state.tray];
      tray[idx] = { ...tp, placedAt: at };
      const moves = state.moves + 1;

      const covered = Object.keys(occupied).length;
      const won = covered === regionCellCount(puzzle);
      if (won) {
        return {
          ...state,
          tray,
          occupied,
          moves,
          hint: null,
          deadEnd: false,
          phase: 'won',
          result: scoreFit(
            state.elapsedMs,
            puzzle.pieces.length,
            state.hintsUsed,
            state.misplacedAttempts,
            state.difficulty ?? DIFFICULTIES.easy,
          ),
        };
      }
      return {
        ...state,
        tray,
        occupied,
        moves,
        hint: null,
        deadEnd: computeDeadEnd(puzzle, occupied, tray),
      };
    }

    case 'PICKUP': {
      const { id } = action;
      const idx = state.tray.findIndex((tp) => tp.piece.id === id);
      if (idx === -1) return state;
      const tp = state.tray[idx];
      if (tp.placedAt === null) return state;

      const occupied: Record<string, number> = {};
      for (const key in state.occupied) {
        if (state.occupied[key] !== id) occupied[key] = state.occupied[key];
      }
      const tray = [...state.tray];
      tray[idx] = { ...tp, placedAt: null };
      return {
        ...state,
        tray,
        occupied,
        selectedId: id,
        hint: null,
        deadEnd: computeDeadEnd(puzzle, occupied, tray),
      };
    }

    case 'HINT': {
      const remaining = remainingPieces(state.tray);
      if (remaining.length === 0) return state;
      const placement = hintPlacement(puzzle.region, occupiedSet(state.occupied), remaining);
      if (placement === null) return state;
      return { ...state, hint: placement, hintsUsed: state.hintsUsed + 1 };
    }

    case 'RESTART': {
      const tray = state.tray.map((tp) => ({ ...tp, placedAt: null }));
      return {
        ...state,
        tray,
        occupied: {},
        selectedId: null,
        hint: null,
        deadEnd: false,
        moves: 0,
        misplacedAttempts: 0,
      };
    }

    default:
      return state;
  }
}

/**
 * React hook wrapping the shape-fit reducer. `start` generates a seeded,
 * solvable puzzle and dispatches START with the current timestamp.
 */
export function useShapeFit(): {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  start: (difficulty: DifficultyConfig, seed?: number) => void;
} {
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback((difficulty: DifficultyConfig, seed: number = Date.now()) => {
    const puzzle = generatePuzzle(difficulty, seed);
    dispatch({ type: 'START', difficulty, puzzle, now: Date.now() });
  }, []);

  return { state, dispatch, start };
}
