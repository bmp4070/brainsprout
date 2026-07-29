import { describe, expect, it } from "vitest";
import { generatePuzzle } from "./generator";
import { DIFFICULTIES } from "./types";
import { canMake } from "./words";

describe("word-wheel generator", () => {
  it("generates valid puzzles for all difficulty levels", () => {
    for (const diffKey of ["easy", "medium", "hard"] as const) {
      const difficulty = DIFFICULTIES[diffKey];
      const puzzle = generatePuzzle(difficulty, 12345);

      expect(puzzle.letters.length).toBeGreaterThanOrEqual(
        difficulty.baseLenMin,
      );
      expect(puzzle.letters.length).toBeLessThanOrEqual(difficulty.baseLenMax);
      expect(puzzle.words.length).toBeGreaterThan(0);

      // Verify 3-letter words are capped at 3 max
      const threeLetterCount = puzzle.words.filter(
        (w) => w.length === 3,
      ).length;
      expect(threeLetterCount).toBeLessThanOrEqual(3);

      // Verify every target word is spellable from the rack
      for (const word of puzzle.words) {
        expect(canMake(word, puzzle.letters)).toBe(true);
      }
    }
  });

  it(
    "limits 3-letter words to at most 3 across multiple seeds",
    { timeout: 15000 },
    () => {
      for (let seed = 1; seed <= 5; seed++) {
        for (const diffKey of ["easy", "medium", "hard"] as const) {
          const puzzle = generatePuzzle(DIFFICULTIES[diffKey], seed);
          const threeLetterWords = puzzle.words.filter((w) => w.length === 3);
          expect(threeLetterWords.length).toBeLessThanOrEqual(3);
        }
      }
    },
  );

  it("is deterministic for the same seed and difficulty", () => {
    const p1 = generatePuzzle(DIFFICULTIES.medium, 9999);
    const p2 = generatePuzzle(DIFFICULTIES.medium, 9999);
    expect(p1).toEqual(p2);
  });
});
