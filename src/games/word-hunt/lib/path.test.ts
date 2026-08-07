import { describe, expect, it } from 'vitest';
import { adjacent, inBounds, isValidPath, pathWord, sameCell } from './path';
import type { Cell } from './types';

const grid = [
  ['C', 'A', 'T'],
  ['O', 'D', 'S'],
  ['G', 'E', 'R'],
];

describe('adjacency + bounds', () => {
  it('detects 8-way adjacency but not self', () => {
    expect(adjacent({ row: 0, col: 0 }, { row: 1, col: 1 })).toBe(true); // diagonal
    expect(adjacent({ row: 0, col: 0 }, { row: 0, col: 1 })).toBe(true);
    expect(adjacent({ row: 0, col: 0 }, { row: 0, col: 2 })).toBe(false); // gap
    expect(adjacent({ row: 1, col: 1 }, { row: 1, col: 1 })).toBe(false); // self
  });

  it('inBounds respects the grid edge', () => {
    expect(inBounds({ row: 0, col: 0 }, 3)).toBe(true);
    expect(inBounds({ row: 2, col: 2 }, 3)).toBe(true);
    expect(inBounds({ row: 3, col: 0 }, 3)).toBe(false);
    expect(inBounds({ row: -1, col: 0 }, 3)).toBe(false);
  });

  it('sameCell compares coordinates', () => {
    expect(sameCell({ row: 1, col: 2 }, { row: 1, col: 2 })).toBe(true);
    expect(sameCell({ row: 1, col: 2 }, { row: 2, col: 1 })).toBe(false);
  });
});

describe('isValidPath', () => {
  it('accepts a contiguous non-repeating path', () => {
    const path: Cell[] = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(isValidPath(path, 3)).toBe(true);
  });

  it('rejects a jump between non-adjacent cells', () => {
    const path: Cell[] = [
      { row: 0, col: 0 },
      { row: 2, col: 2 },
    ];
    expect(isValidPath(path, 3)).toBe(false);
  });

  it('rejects a revisited cell', () => {
    const path: Cell[] = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 0 },
    ];
    expect(isValidPath(path, 3)).toBe(false);
  });

  it('rejects an out-of-bounds cell', () => {
    expect(isValidPath([{ row: 5, col: 5 }], 3)).toBe(false);
  });
});

describe('pathWord', () => {
  it('reads letters along the path, lowercased', () => {
    const path: Cell[] = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(pathWord(path, grid)).toBe('cat');
  });
});
