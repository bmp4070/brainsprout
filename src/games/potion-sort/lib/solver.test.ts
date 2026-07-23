import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { applyPour, canPour, isSolved } from './rules';
import { hintMove, solveMinPours } from './solver';
import { DIFFICULTIES } from './types';
import type { BoardState } from './types';

/** Unpruned move generator, independent of `legalMoves`. */
function allMoves(board: BoardState): { from: number; to: number }[] {
  const moves: { from: number; to: number }[] = [];
  for (let from = 0; from < board.length; from += 1) {
    for (let to = 0; to < board.length; to += 1) {
      if (from !== to && canPour(board[from], board[to])) moves.push({ from, to });
    }
  }
  return moves;
}

function rawKey(board: BoardState): string {
  return board.map((b) => b.join(',')).join('|');
}

/**
 * Independent iterative-deepening DFS, deliberately written without any of the
 * solver's helpers (no canonical keys, no pruned move list), used to
 * cross-check BFS optimality on small boards.
 */
function iddfsMinPours(board: BoardState, maxDepth: number): number {
  if (isSolved(board)) return 0;

  for (let limit = 1; limit <= maxDepth; limit += 1) {
    const bestRemaining = new Map<string, number>();

    const dfs = (current: BoardState, remaining: number): boolean => {
      if (remaining === 0) return false;
      const key = rawKey(current);
      const seen = bestRemaining.get(key);
      if (seen !== undefined && seen >= remaining) return false;
      bestRemaining.set(key, remaining);

      for (const m of allMoves(current)) {
        const child = applyPour(current, m.from, m.to);
        if (isSolved(child)) return true;
        if (dfs(child, remaining - 1)) return true;
      }
      return false;
    };

    if (dfs(board, limit)) return limit;
  }
  return -1;
}

describe('solveMinPours', () => {
  it('reports 0 pours for an already-solved board', () => {
    const result = solveMinPours([[0, 0, 0, 0], [1, 1, 1, 1], []]);
    expect(result).toEqual({ pours: 0, exact: true, firstMove: null });
  });

  it('solves a hand-built one-pour board', () => {
    const board: BoardState = [[0, 0, 0], [1, 1, 1, 1], [0]];
    const result = solveMinPours(board);
    expect(result.exact).toBe(true);
    expect(result.pours).toBe(1);
    expect(result.firstMove).not.toBeNull();
    const { from, to } = result.firstMove!;
    expect(isSolved(applyPour(board, from, to))).toBe(true);
  });

  it('solves a hand-built two-color board in exactly 3 pours', () => {
    // Bottle 0: 0,0,0,1  Bottle 1: 1,1,1,0  plus one empty.
    // Park a top unit in the empty, cap the matching bottle, pour it back.
    // No shorter order exists.
    const board: BoardState = [[0, 0, 0, 1], [1, 1, 1, 0], []];
    const result = solveMinPours(board);
    expect(result.exact).toBe(true);
    expect(result.pours).toBe(3);
    expect(result.firstMove).not.toBeNull();
    // The only useful opening moves park a top unit in the empty bottle.
    expect(result.firstMove!.to).toBe(2);
    expect(solveMinPours(applyPour(board, result.firstMove!.from, 2)).pours).toBe(2);
  });

  it('detects an unsolvable board definitively', () => {
    const result = solveMinPours([[0, 0, 0, 1], [1, 1, 1, 0]]);
    expect(result).toEqual({ pours: -1, exact: true, firstMove: null });
  });

  it('returns exact=false when the node budget is exhausted', () => {
    const puzzle = generatePuzzle(DIFFICULTIES.hard, 7);
    const result = solveMinPours(puzzle.board, 5);
    expect(result.exact).toBe(false);
    expect(result.pours).toBe(-1);
    expect(result.firstMove).toBeNull();
  });

  it('matches an independent IDDFS on generated easy boards', () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const puzzle = generatePuzzle(DIFFICULTIES.easy, seed);
      const bfs = solveMinPours(puzzle.board);
      expect(bfs.exact).toBe(true);
      expect(iddfsMinPours(puzzle.board, bfs.pours)).toBe(bfs.pours);
    }
  });
});

describe('hintMove', () => {
  it('returns null when there is no legal move', () => {
    expect(hintMove([[0, 0, 0, 1], [1, 1, 1, 0]])).toBeNull();
  });

  it('returns a legal first move of an optimal solution when exact', () => {
    for (let seed = 1; seed <= 15; seed += 1) {
      const puzzle = generatePuzzle(DIFFICULTIES.easy, seed);
      const move = hintMove(puzzle.board);
      expect(move).not.toBeNull();
      const { from, to } = move!;
      expect(canPour(puzzle.board[from], puzzle.board[to])).toBe(true);

      // Taking the hint must reduce the remaining minimum by exactly one.
      const next = applyPour(puzzle.board, from, to);
      const after = solveMinPours(next);
      expect(after.exact).toBe(true);
      expect(after.pours).toBe(puzzle.par - 1);
    }
  });

  it('still returns a legal move when the budget is too small for BFS', () => {
    const puzzle = generatePuzzle(DIFFICULTIES.hard, 3);
    const move = hintMove(puzzle.board, 1);
    expect(move).not.toBeNull();
    expect(canPour(puzzle.board[move!.from], puzzle.board[move!.to])).toBe(true);
  });

  it('prefers a move that completes a bottle over one that wastes an empty', () => {
    // Bottle 0 needs one more 0 to be complete; bottle 1 can supply it.
    const board: BoardState = [[0, 0, 0], [1, 1, 0], [1, 1], []];
    const move = hintMove(board, 1);
    expect(move).toEqual({ from: 1, to: 0 });
  });
});
