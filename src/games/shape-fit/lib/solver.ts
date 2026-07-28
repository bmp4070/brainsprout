import { canPlace, orientations } from './shapes';
import type { Cell, Piece, Placement } from './types';

export interface SolveResult {
  /** One valid tiling of the remaining region, or null if impossible. */
  solution: Placement[] | null;
  /** false if the node budget was hit before finding/exhausting the search. */
  exact: boolean;
}

/** Default recursion budget. Comfortable for ≤24 cells / ≤6 pieces. */
export const DEFAULT_NODE_BUDGET = 500_000;

/**
 * Exact-cover backtracking: tile every still-empty region cell using each
 * remaining piece exactly once. `occupied` holds already-covered cells.
 *
 * Classic pruning: at each step target the LOWEST uncovered region cell in
 * row-major order; the piece covering it must have one of its cells on that
 * target, which bounds the branching factor to (pieces × orientations × cells
 * of that orientation). Orientations are precomputed once per piece.
 *
 * Deterministic given the input ordering of `remaining` (and the orientation
 * order produced by `orientations`). Returns exact = false only when the node
 * budget was reached before the search finished.
 */
export function solveRemaining(
  region: boolean[][],
  occupied: ReadonlySet<string>,
  remaining: Piece[],
  nodeBudget: number = DEFAULT_NODE_BUDGET,
): SolveResult {
  const rows = region.length;
  const cols = rows > 0 ? region[0].length : 0;

  // Quick parity check: remaining piece cells must equal empty region cells.
  let emptyCount = 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (region[r][c] && !occupied.has(`${r},${c}`)) emptyCount += 1;
    }
  }
  let pieceCells = 0;
  for (const piece of remaining) pieceCells += piece.cells.length;
  if (pieceCells !== emptyCount) return { solution: null, exact: true };

  const orients: Cell[][][] = remaining.map((piece) => orientations(piece.cells));
  const covered = new Set<string>(occupied);
  const used: boolean[] = remaining.map(() => false);
  const placements: Placement[] = [];

  let nodes = 0;
  let budgetHit = false;

  const findTarget = (): Cell | null => {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (region[r][c] && !covered.has(`${r},${c}`)) return { r, c };
      }
    }
    return null;
  };

  const recurse = (): boolean => {
    nodes += 1;
    if (nodes > nodeBudget) {
      budgetHit = true;
      return false;
    }
    const target = findTarget();
    if (target === null) return true;

    for (let i = 0; i < remaining.length; i += 1) {
      if (used[i]) continue;
      for (const oriented of orients[i]) {
        for (const anchor of oriented) {
          const offR = target.r - anchor.r;
          const offC = target.c - anchor.c;
          const abs = oriented.map((cell) => ({ r: cell.r + offR, c: cell.c + offC }));
          if (!canPlace(region, covered, abs)) continue;

          used[i] = true;
          for (const cell of abs) covered.add(`${cell.r},${cell.c}`);
          placements.push({ pieceId: remaining[i].id, cells: abs });

          if (recurse()) return true;

          placements.pop();
          for (const cell of abs) covered.delete(`${cell.r},${cell.c}`);
          used[i] = false;
          if (budgetHit) return false;
        }
      }
    }
    return false;
  };

  const solved = recurse();
  if (budgetHit) return { solution: null, exact: false };
  return { solution: solved ? placements.map((p) => ({ ...p })) : null, exact: true };
}

/**
 * A hint placement: the first placement of some full completion (covers the
 * lowest uncovered cell). Returns null if the remaining region cannot be
 * completed (or the budget ran out).
 */
export function hintPlacement(
  region: boolean[][],
  occupied: ReadonlySet<string>,
  remaining: Piece[],
  nodeBudget: number = DEFAULT_NODE_BUDGET,
): Placement | null {
  const { solution } = solveRemaining(region, occupied, remaining, nodeBudget);
  if (solution === null || solution.length === 0) return null;
  return solution[0];
}

/**
 * Dead-end check: can the remaining pieces still tile the remaining region?
 * Conservative on budget exhaustion — if the search could not finish, we
 * report `true` (completable) rather than falsely flagging a dead end.
 */
export function isCompletable(
  region: boolean[][],
  occupied: ReadonlySet<string>,
  remaining: Piece[],
  nodeBudget: number = DEFAULT_NODE_BUDGET,
): boolean {
  const { solution, exact } = solveRemaining(region, occupied, remaining, nodeBudget);
  if (solution !== null) return true;
  return !exact; // budget hit -> assume still completable
}
