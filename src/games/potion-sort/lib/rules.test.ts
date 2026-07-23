import { describe, expect, it } from 'vitest';
import {
  applyPour,
  canPour,
  canonicalKey,
  isDeadEnd,
  isSolved,
  legalMoves,
  pour,
  topColor,
  topRunLength,
} from './rules';
import type { BoardState } from './types';

describe('topColor', () => {
  it('returns null for an empty bottle', () => {
    expect(topColor([])).toBeNull();
  });

  it('returns the last (topmost) unit', () => {
    expect(topColor([0])).toBe(0);
    expect(topColor([0, 1, 1, 2])).toBe(2);
  });
});

describe('topRunLength', () => {
  it('is 0 for an empty bottle', () => {
    expect(topRunLength([])).toBe(0);
  });

  it('counts only the contiguous top run', () => {
    expect(topRunLength([1])).toBe(1);
    expect(topRunLength([0, 1, 1])).toBe(2);
    expect(topRunLength([1, 0, 1, 1])).toBe(2);
    expect(topRunLength([2, 2, 2, 2])).toBe(4);
    expect(topRunLength([1, 1, 2, 3])).toBe(1);
  });
});

describe('canPour', () => {
  it('allows pouring into an empty bottle', () => {
    expect(canPour([0, 1], [])).toBe(true);
  });

  it('allows pouring onto a matching top color', () => {
    expect(canPour([0, 1], [1])).toBe(true);
  });

  it('rejects a mismatched top color', () => {
    expect(canPour([0, 1], [2])).toBe(false);
  });

  it('rejects a full target', () => {
    expect(canPour([1], [1, 1, 1, 1])).toBe(false);
  });

  it('rejects an empty source', () => {
    expect(canPour([], [])).toBe(false);
    expect(canPour([], [1])).toBe(false);
  });

  it('rejects pouring a bottle into itself', () => {
    const b = [1, 1];
    expect(canPour(b, b)).toBe(false);
  });
});

describe('pour', () => {
  it('moves the entire top run into an empty bottle', () => {
    expect(pour([0, 1, 1], [])).toEqual([[0], [1, 1]]);
  });

  it('limits the amount to the free space of the target', () => {
    expect(pour([1, 1, 1], [1, 1])).toEqual([
      [1],
      [1, 1, 1, 1],
    ]);
  });

  it('moves only the top run, not deeper same-colored units', () => {
    expect(pour([1, 0, 1, 1], [1])).toEqual([
      [1, 0],
      [1, 1, 1],
    ]);
  });

  it('does not mutate its inputs', () => {
    const from = [0, 1];
    const to: number[] = [];
    pour(from, to);
    expect(from).toEqual([0, 1]);
    expect(to).toEqual([]);
  });

  it('throws on an illegal pour', () => {
    expect(() => pour([], [1])).toThrow();
    expect(() => pour([0], [1])).toThrow();
    expect(() => pour([0], [0, 0, 0, 0])).toThrow();
  });
});

describe('applyPour', () => {
  it('returns a new board and leaves the original untouched', () => {
    const board: BoardState = [[0, 1], [1], []];
    const next = applyPour(board, 0, 1);
    expect(next).toEqual([[0], [1, 1], []]);
    expect(board).toEqual([[0, 1], [1], []]);
    expect(next).not.toBe(board);
    expect(next[2]).toBe(board[2]);
  });

  it('throws when source and target are the same index', () => {
    expect(() => applyPour([[0]], 0, 0)).toThrow();
  });
});

describe('isSolved', () => {
  it('accepts empty and full single-colored bottles', () => {
    expect(isSolved([[0, 0, 0, 0], [1, 1, 1, 1], []])).toBe(true);
    expect(isSolved([[], []])).toBe(true);
  });

  it('rejects a partially filled single-colored bottle', () => {
    expect(isSolved([[0, 0], [0, 0], []])).toBe(false);
  });

  it('rejects a full mixed bottle', () => {
    expect(isSolved([[0, 0, 0, 1], [1, 1, 1, 0]])).toBe(false);
  });
});

describe('canonicalKey', () => {
  it('is insensitive to bottle order', () => {
    const a: BoardState = [[0, 1], [1], []];
    const b: BoardState = [[], [1], [0, 1]];
    expect(canonicalKey(a)).toBe(canonicalKey(b));
  });

  it('distinguishes different contents', () => {
    expect(canonicalKey([[0, 1]])).not.toBe(canonicalKey([[1, 0]]));
  });
});

/** Every legal pour, with no pruning at all - the reference move generator. */
function allMoves(board: BoardState): { from: number; to: number }[] {
  const moves: { from: number; to: number }[] = [];
  for (let from = 0; from < board.length; from += 1) {
    for (let to = 0; to < board.length; to += 1) {
      if (from !== to && canPour(board[from], board[to])) moves.push({ from, to });
    }
  }
  return moves;
}

/** Unpruned BFS over canonical states, used to validate the pruned search. */
function referenceMinPours(board: BoardState): number {
  if (isSolved(board)) return 0;
  const seen = new Set([canonicalKey(board)]);
  let frontier: BoardState[] = [board];
  let depth = 0;
  while (frontier.length > 0 && depth < 40) {
    depth += 1;
    const next: BoardState[] = [];
    for (const b of frontier) {
      for (const m of allMoves(b)) {
        const child = applyPour(b, m.from, m.to);
        const key = canonicalKey(child);
        if (seen.has(key)) continue;
        seen.add(key);
        if (isSolved(child)) return depth;
        next.push(child);
      }
    }
    frontier = next;
  }
  return -1;
}

/** BFS restricted to the pruned `legalMoves` list. */
function prunedMinPours(board: BoardState): number {
  if (isSolved(board)) return 0;
  const seen = new Set([canonicalKey(board)]);
  let frontier: BoardState[] = [board];
  let depth = 0;
  while (frontier.length > 0 && depth < 40) {
    depth += 1;
    const next: BoardState[] = [];
    for (const b of frontier) {
      for (const m of legalMoves(b)) {
        const child = applyPour(b, m.from, m.to);
        const key = canonicalKey(child);
        if (seen.has(key)) continue;
        seen.add(key);
        if (isSolved(child)) return depth;
        next.push(child);
      }
    }
    frontier = next;
  }
  return -1;
}

describe('legalMoves', () => {
  it('lists the useful pours on a simple board', () => {
    // Bottle 0 tops with color 1, bottle 1 tops with color 0, so neither can
    // pour onto the other; only the empty bottle is a valid target.
    const board: BoardState = [[0, 1], [1, 0], []];
    expect(legalMoves(board)).toEqual([
      { from: 0, to: 2 },
      { from: 1, to: 2 },
    ]);
  });

  it('never offers a mismatched target', () => {
    const board: BoardState = [[0, 1], [1, 0], []];
    for (const m of legalMoves(board)) {
      expect(canPour(board[m.from], board[m.to])).toBe(true);
    }
  });

  it('offers only the FIRST empty bottle as a target', () => {
    const board: BoardState = [[0, 1], [], []];
    const emptyTargets = legalMoves(board).filter((m) => board[m.to].length === 0);
    expect(emptyTargets).toEqual([{ from: 0, to: 1 }]);
  });

  it('never pours a uniform bottle into an empty bottle', () => {
    const board: BoardState = [[1, 1, 1], [0, 1], []];
    const moves = legalMoves(board);
    expect(moves).not.toContainEqual({ from: 0, to: 2 });
    expect(moves).toContainEqual({ from: 1, to: 2 });
    expect(moves).toContainEqual({ from: 1, to: 0 });
  });

  it('is empty when nothing can move', () => {
    expect(legalMoves([[0, 0, 0, 0], [1, 1, 1, 1]])).toEqual([]);
    expect(legalMoves([[], []])).toEqual([]);
  });

  it('pruning never loses a solution or lengthens it', () => {
    const boards: BoardState[] = [
      [[0, 1, 0, 1], [1, 0, 1, 0], [], []],
      [[0, 1, 1], [1, 0, 0], [], []],
      [[0, 0, 1, 1], [1, 1, 0, 0], [2, 2, 2, 2], [], []],
      [[0, 1, 2, 0], [1, 2, 0, 1], [2, 0, 1, 2], [], []],
      [[0, 0, 0, 1], [1, 1, 1, 0], []],
    ];
    for (const board of boards) {
      expect(prunedMinPours(board)).toBe(referenceMinPours(board));
    }
  });
});

describe('isDeadEnd', () => {
  it('is false for a solved board', () => {
    expect(isDeadEnd([[0, 0, 0, 0], []])).toBe(false);
  });

  it('is true when unsolved with no moves left', () => {
    expect(isDeadEnd([[0, 0, 0, 1], [1, 1, 1, 0]])).toBe(true);
  });

  it('is false while moves remain', () => {
    expect(isDeadEnd([[0, 0, 0, 1], [1, 1, 1, 0], []])).toBe(false);
  });
});
