import type { Piece, Placement, Tri } from './types';
import { triKey } from './types';
import { orientations, placeAt } from './tri';

export interface SolveResult {
  solution: Placement[] | null;
  /** false when the node budget was exhausted before a definitive answer. */
  exact: boolean;
}

const DEFAULT_NODE_BUDGET = 1_000_000;

/** Region tris sorted deterministically (row, then col, then dir). */
function sortedRegion(regionSet: ReadonlySet<string>): Tri[] {
  const tris: Tri[] = [];
  for (const key of regionSet) {
    const [r, c, d] = key.split(',').map(Number);
    tris.push({ r, c, d: d as Tri['d'] });
  }
  return tris.sort((a, b) => a.r - b.r || a.c - b.c || a.d - b.d);
}

interface OrientedPiece {
  pieceId: number;
  orientations: Tri[][];
}

/**
 * Exact-cover backtracking: tile the still-empty region tris using each
 * remaining piece exactly once. Always targets the lowest uncovered region tri
 * and tries every piece × orientation × translation that covers it.
 */
export function solveRemaining(
  regionSet: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  remaining: Piece[],
  nodeBudget: number = DEFAULT_NODE_BUDGET,
): SolveResult {
  const region = sortedRegion(regionSet);
  const covered = new Set(occupied);
  const oriented: OrientedPiece[] = remaining.map((p) => ({
    pieceId: p.id,
    orientations: orientations(p.tris),
  }));
  const used = new Array<boolean>(oriented.length).fill(false);
  const result: Placement[] = [];
  let nodes = 0;
  let budgetHit = false;

  /** Lowest region tri not yet covered, or null when all are covered. */
  function lowestUncovered(): Tri | null {
    for (const t of region) {
      if (!covered.has(triKey(t))) return t;
    }
    return null;
  }

  function search(): boolean {
    if (budgetHit) return false;
    if (nodes++ > nodeBudget) {
      budgetHit = true;
      return false;
    }
    const target = lowestUncovered();
    if (target === null) return true; // fully covered
    for (let i = 0; i < oriented.length; i += 1) {
      if (used[i]) continue;
      for (const orient of oriented[i].orientations) {
        for (const anchor of orient) {
          if (anchor.d !== target.d) continue;
          const dr = target.r - anchor.r;
          const dc = target.c - anchor.c;
          const abs = placeAt(orient, dr, dc);
          let fits = true;
          for (const t of abs) {
            const key = triKey(t);
            if (!regionSet.has(key) || covered.has(key)) {
              fits = false;
              break;
            }
          }
          if (!fits) continue;
          const keys = abs.map(triKey);
          for (const key of keys) covered.add(key);
          used[i] = true;
          result.push({ pieceId: oriented[i].pieceId, tris: abs });
          if (search()) return true;
          result.pop();
          used[i] = false;
          for (const key of keys) covered.delete(key);
          if (budgetHit) return false;
        }
      }
    }
    return false;
  }

  const solved = search();
  if (solved) return { solution: result.map((p) => ({ ...p })), exact: true };
  if (budgetHit) return { solution: null, exact: false };
  return { solution: null, exact: true };
}

/**
 * A valid placement for one remaining piece that is part of some full
 * completion (the placement covering the lowest uncovered region tri). null if
 * not completable.
 */
export function hintPlacement(
  regionSet: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  remaining: Piece[],
  nodeBudget?: number,
): Placement | null {
  const { solution } = solveRemaining(regionSet, occupied, remaining, nodeBudget);
  if (!solution) return null;
  const region = sortedRegion(regionSet);
  const target = region.find((t) => !occupied.has(triKey(t)));
  if (!target) return null;
  const targetKey = triKey(target);
  return solution.find((p) => p.tris.some((t) => triKey(t) === targetKey)) ?? solution[0];
}

/**
 * Can the remaining pieces still tile the remaining region? Conservatively
 * true when the node budget is exhausted (so we never wrongly declare a dead
 * end).
 */
export function isCompletable(
  regionSet: ReadonlySet<string>,
  occupied: ReadonlySet<string>,
  remaining: Piece[],
  nodeBudget?: number,
): boolean {
  const { solution, exact } = solveRemaining(regionSet, occupied, remaining, nodeBudget);
  if (solution) return true;
  return !exact;
}
