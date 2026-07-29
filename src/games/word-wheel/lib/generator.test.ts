import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { DIFFICULTIES } from './types';
import { canMake } from './words';

describe('word-wheel generator', () => {
  it('generates valid puzzles for all difficulty levels', () => {
    for (const diffKey of ['easy', 'medium', 'hard'] as const) {
      const difficulty = DIFFICULTIES[diffKey];
      const puzzle = generatePuzzle(difficulty, 12345);

      expect(puzzle.letters.length).toBeGreaterThanOrEqual(difficulty.baseLenMin);
      expect(puzzle.letters.length).toBeLessThanOrEqual(difficulty.baseLenMax);
      expect(puzzle.words.length).toBeGreaterThan(0);

      // Verify every target word is spellable from the rack
      for (const word of puzzle.words) {
        expect(canMake(word, puzzle.letters)).toBe(true);
      }
    }
  });

  it('is deterministic for the same seed and difficulty', () => {
    const p1 = generatePuzzle(DIFFICULTIES.medium, 9999);
    const p2 = generatePuzzle(DIFFICULTIES.medium, 9999);
    expect(p1).toEqual(p2);
  });
});
