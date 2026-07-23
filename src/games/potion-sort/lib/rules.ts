import { CAPACITY } from './types';
import type { BoardState, Bottle } from './types';

/** The color of the topmost unit, or null for an empty bottle. */
export function topColor(b: Bottle): number | null {
  return b.length === 0 ? null : b[b.length - 1];
}

/** Size of the top contiguous run of same-colored units (0 when empty). */
export function topRunLength(b: Bottle): number {
  if (b.length === 0) return 0;
  const color = b[b.length - 1];
  let n = 1;
  for (let i = b.length - 2; i >= 0 && b[i] === color; i -= 1) n += 1;
  return n;
}

/**
 * A pour `from -> to` is legal iff the source is non-empty, the target is a
 * different bottle that is not full, and the target is either empty or its top
 * color matches the source's top color.
 */
export function canPour(from: Bottle, to: Bottle): boolean {
  if (from === to) return false;
  if (from.length === 0) return false;
  if (to.length >= CAPACITY) return false;
  const target = topColor(to);
  return target === null || target === topColor(from);
}

/**
 * Pours the entire top run of `from` into `to`, limited by the target's free
 * space. Returns fresh `[newFrom, newTo]` arrays; the inputs are untouched.
 * Throws when the pour is illegal - callers must check `canPour` first.
 */
export function pour(from: Bottle, to: Bottle): [Bottle, Bottle] {
  if (!canPour(from, to)) {
    throw new Error('pour: illegal move');
  }
  const color = from[from.length - 1];
  const amount = Math.min(topRunLength(from), CAPACITY - to.length);
  const newFrom = from.slice(0, from.length - amount);
  const newTo = to.slice();
  for (let i = 0; i < amount; i += 1) newTo.push(color);
  return [newFrom, newTo];
}

/** Immutably applies a pour to a board, returning a new board. */
export function applyPour(board: BoardState, fromIdx: number, toIdx: number): BoardState {
  if (fromIdx === toIdx) {
    throw new Error('applyPour: source and target must differ');
  }
  const [newFrom, newTo] = pour(board[fromIdx], board[toIdx]);
  const next = board.slice();
  next[fromIdx] = newFrom;
  next[toIdx] = newTo;
  return next;
}

/** True when a bottle is full and holds a single color. */
function isComplete(b: Bottle): boolean {
  if (b.length !== CAPACITY) return false;
  for (let i = 1; i < b.length; i += 1) {
    if (b[i] !== b[0]) return false;
  }
  return true;
}

/**
 * Solved = every bottle is either empty or full-and-single-colored. Because
 * each color has exactly CAPACITY units, this means every color ends up
 * occupying exactly one bottle. A bottle holding 2 units of one color is NOT
 * complete.
 */
export function isSolved(board: BoardState): boolean {
  for (const b of board) {
    if (b.length !== 0 && !isComplete(b)) return false;
  }
  return true;
}

/** True when every unit in the bottle shares one color (empty counts as false). */
function isUniform(b: Bottle): boolean {
  if (b.length === 0) return false;
  for (let i = 1; i < b.length; i += 1) {
    if (b[i] !== b[0]) return false;
  }
  return true;
}

/**
 * All *useful* legal pours, as `{ from, to }` index pairs.
 *
 * Two prunings keep the search branching factor small. Both are safe: they
 * never remove the last remaining optimal solution.
 *
 * 1. **No pouring a uniform bottle into an empty bottle.** If `from` holds one
 *    color and nothing else, moving its whole content into an empty bottle
 *    produces a board identical to the original up to swapping those two
 *    bottles. Since both the goal test (`isSolved`) and the move rules are
 *    invariant under permuting bottles, any solution that starts with such a
 *    move can be replayed with the two bottle indices exchanged, giving a
 *    solution of the same length that omits it. So optimal length is preserved.
 *
 * 2. **All empty bottles are interchangeable: only the FIRST empty index is
 *    offered as a target.** Pouring into empty bottle `i` versus empty bottle
 *    `j` yields two boards that differ only by the transposition of `i` and
 *    `j`. Again by permutation-invariance, the two subtrees are isomorphic and
 *    have equal optimal depth, so keeping one representative is enough.
 *    `canonicalKey` (which sorts bottles) collapses such boards anyway.
 *
 * Both prunings also keep `isDeadEnd` sound: the moves removed by (1) make no
 * progress and the ones removed by (2) are duplicates of a retained move.
 *
 * NOTE: this is the *search* move list. UI code should use `canPour` for
 * "may the player tap this bottle", since players are allowed to make
 * redundant moves.
 */
export function legalMoves(board: BoardState): { from: number; to: number }[] {
  const firstEmpty = board.findIndex((b) => b.length === 0);
  const moves: { from: number; to: number }[] = [];

  for (let from = 0; from < board.length; from += 1) {
    const source = board[from];
    if (source.length === 0) continue;

    // Pruning 1+2: the only empty target worth considering is `firstEmpty`,
    // and only when the source is not already a single-color bottle.
    if (firstEmpty !== -1 && !isUniform(source)) {
      moves.push({ from, to: firstEmpty });
    }

    for (let to = 0; to < board.length; to += 1) {
      if (to === from) continue;
      const target = board[to];
      if (target.length === 0) continue; // empties handled above
      if (target.length >= CAPACITY) continue;
      if (topColor(target) !== topColor(source)) continue;
      moves.push({ from, to });
    }
  }

  return moves;
}

/** Not solved, and no useful move remains. */
export function isDeadEnd(board: BoardState): boolean {
  return !isSolved(board) && legalMoves(board).length === 0;
}

/**
 * Order-insensitive key for memoization: each bottle is serialized bottom->top
 * and the serialized bottles are sorted, so boards that differ only by which
 * bottle holds what collapse to one key.
 */
export function canonicalKey(board: BoardState): string {
  const parts = new Array<string>(board.length);
  for (let i = 0; i < board.length; i += 1) parts[i] = board[i].join(',');
  parts.sort();
  return parts.join('|');
}
