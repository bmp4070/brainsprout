import { CAPACITY } from './types';
import type { BoardState, Bottle } from './types';
import { applyPour, canonicalKey, isSolved, legalMoves, topColor, topRunLength } from './rules';

export interface SolveResult {
  /**
   * Minimum number of pours to solve. `0` when the board is already solved,
   * and `-1` when no solution was found (either the board is provably
   * unsolvable - then `exact` is true - or the node budget ran out - then
   * `exact` is false).
   */
  pours: number;
  /** True when the BFS reached a definitive answer within the node budget. */
  exact: boolean;
  /** First move of some shortest solution, or null when there is none. */
  firstMove: { from: number; to: number } | null;
}

/** Default search budget: states expanded before giving up. */
export const DEFAULT_NODE_BUDGET = 200_000;

/**
 * Breadth-first search over canonical board states (see `canonicalKey`), so
 * boards that differ only by bottle order are visited once. Every queued state
 * remembers the move that left the ROOT, which is all a hint needs; BFS order
 * guarantees the first solved state found sits at minimum depth.
 */
export function solveMinPours(
  board: BoardState,
  nodeBudget: number = DEFAULT_NODE_BUDGET,
): SolveResult {
  if (isSolved(board)) return { pours: 0, exact: true, firstMove: null };

  const seen = new Set<string>([canonicalKey(board)]);
  const boards: BoardState[] = [board];
  const depths: number[] = [0];
  const firstMoves: ({ from: number; to: number } | null)[] = [null];

  let head = 0;
  let expanded = 0;

  while (head < boards.length) {
    if (expanded >= nodeBudget) {
      return { pours: -1, exact: false, firstMove: null };
    }
    const current = boards[head];
    const depth = depths[head];
    const rootMove = firstMoves[head];
    head += 1;
    expanded += 1;

    for (const move of legalMoves(current)) {
      const next = applyPour(current, move.from, move.to);
      const key = canonicalKey(next);
      if (seen.has(key)) continue;
      seen.add(key);

      const childMove = rootMove ?? move;
      if (isSolved(next)) {
        return { pours: depth + 1, exact: true, firstMove: childMove };
      }
      boards.push(next);
      depths.push(depth + 1);
      firstMoves.push(childMove);
    }
  }

  // Queue exhausted within budget: the board is genuinely unsolvable.
  return { pours: -1, exact: true, firstMove: null };
}

/** True when a bottle is full and single-colored. */
function completes(b: Bottle): boolean {
  if (b.length !== CAPACITY) return false;
  for (let i = 1; i < b.length; i += 1) {
    if (b[i] !== b[0]) return false;
  }
  return true;
}

/**
 * Ranks a legal move without search. Higher is better:
 *  +100 finishing a bottle (target becomes full and single-colored)
 *   +40 emptying the source onto a non-empty target (frees a bottle)
 *   +10 merging onto a matching non-empty target (consolidation)
 *   -30 consuming an empty bottle (scarce working space)
 * plus the number of units moved as a tie-break.
 *
 * A pure "undo" of the previous pour can never finish a bottle nor merge onto
 * a matching color without also being a consolidation, and it always scores
 * below the forward move that created the position, so the ranking naturally
 * avoids ping-ponging even though `hintMove` is stateless.
 */
function heuristicScore(board: BoardState, move: { from: number; to: number }): number {
  const from = board[move.from];
  const to = board[move.to];
  const amount = Math.min(topRunLength(from), CAPACITY - to.length);
  const next = applyPour(board, move.from, move.to);

  let score = amount;
  if (completes(next[move.to])) score += 100;
  if (to.length === 0) {
    score -= 30;
  } else {
    score += 10;
    if (next[move.from].length === 0) score += 40;
  }
  // Prefer pouring onto a deeper matching stack, all else equal.
  if (topColor(to) === topColor(from)) score += 5;
  return score;
}

/**
 * Best next move to show as a hint. Prefers the first move of a shortest
 * solution; if the BFS cannot finish within `nodeBudget` (or the position is
 * already lost) it falls back to the best-ranked legal move, and returns null
 * only when there is no legal move at all.
 */
export function hintMove(
  board: BoardState,
  nodeBudget: number = DEFAULT_NODE_BUDGET,
): { from: number; to: number } | null {
  const solved = solveMinPours(board, nodeBudget);
  if (solved.firstMove !== null) return solved.firstMove;

  const moves = legalMoves(board);
  if (moves.length === 0) return null;

  let best = moves[0];
  let bestScore = heuristicScore(board, best);
  for (let i = 1; i < moves.length; i += 1) {
    const score = heuristicScore(board, moves[i]);
    if (score > bestScore) {
      best = moves[i];
      bestScore = score;
    }
  }
  return best;
}
