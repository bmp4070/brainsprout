import { describe, expect, it } from 'vitest';
import { solveBoard, findPath } from './solver';
import { isValidPath, pathWord } from './path';
import { isWord } from './dictionary';

// A hand-made grid that clearly contains CAT, CATS, DOG, GOD, ...
const grid = [
  ['C', 'A', 'T'],
  ['O', 'D', 'S'],
  ['G', 'O', 'R'],
];

describe('solveBoard', () => {
  const words = solveBoard(grid, 3);

  it('finds only real dictionary words', () => {
    for (const w of words) expect(isWord(w)).toBe(true);
  });

  it('finds words that are actually traceable on the board', () => {
    for (const w of words) {
      const path = findPath(grid, w);
      expect(path).not.toBeNull();
      expect(pathWord(path!, grid)).toBe(w);
      expect(isValidPath(path!, grid.length)).toBe(true);
    }
  });

  it('respects the minimum length', () => {
    const longOnly = solveBoard(grid, 4);
    for (const w of longOnly) expect(w.length).toBeGreaterThanOrEqual(4);
  });

  it('returns results sorted by length then alpha', () => {
    for (let i = 1; i < words.length; i += 1) {
      const a = words[i - 1];
      const b = words[i];
      expect(a.length < b.length || (a.length === b.length && a <= b)).toBe(true);
    }
  });

  it('contains at least one expected common word', () => {
    expect(words).toContain('cat');
  });
});

describe('findPath', () => {
  it('returns null for an untraceable word', () => {
    expect(findPath(grid, 'zzz')).toBeNull();
  });

  it('never reuses a cell in the returned path', () => {
    const path = findPath(grid, 'cat');
    expect(path).not.toBeNull();
    const keys = path!.map((c) => `${c.row},${c.col}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
