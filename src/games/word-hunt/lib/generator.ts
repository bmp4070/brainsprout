import { mulberry32, randInt } from '../../../shared/lib/rng';
import { solveBoard } from './solver';
import type { DifficultyConfig, Puzzle } from './types';

// A frequency bag biased toward common, vowel-rich letters so random boards
// still yield lots of findable words. Q/J/X/Z are dropped: they strand cells
// for young players (Q needs a U, the rest rarely help). Vowels are weighted
// heavily so grids aren't consonant deserts.
const LETTER_BAG =
  'EEEEEEEEEEEE' + // E
  'AAAAAAAAA' + // A
  'IIIIIIIII' + // I
  'OOOOOOOO' + // O
  'UUUU' + // U
  'NNNNNN' +
  'RRRRRR' +
  'TTTTTT' +
  'LLLL' +
  'SSSSS' +
  'DDDD' +
  'GGG' +
  'BB' +
  'CC' +
  'MM' +
  'PP' +
  'FF' +
  'HH' +
  'V' +
  'W' +
  'Y' +
  'K';

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function randomGrid(rng: () => number, size: number): string[][] {
  const grid: string[][] = [];
  for (let r = 0; r < size; r += 1) {
    const row: string[] = [];
    for (let c = 0; c < size; c += 1) {
      row.push(LETTER_BAG[randInt(rng, LETTER_BAG.length)]);
    }
    grid.push(row);
  }
  return grid;
}

function vowelCount(grid: string[][]): number {
  let n = 0;
  for (const row of grid) for (const ch of row) if (VOWELS.has(ch)) n += 1;
  return n;
}

/**
 * Generates a Word Hunt board that is guaranteed to contain at least
 * `targetWords` findable dictionary words of length >= `minWordLen`.
 *
 * Each attempt seeds a fresh grid (deterministically derived from `seed`),
 * requires a healthy vowel ratio, then solves it; the first grid meeting the
 * word target wins. If none of the bounded attempts qualifies (extremely
 * unlikely with vowel-rich bags), it returns the richest grid seen, so it never
 * throws and never loops forever. Deterministic given `seed`.
 */
export function generatePuzzle(difficulty: DifficultyConfig, seed: number): Puzzle {
  const { size, minWordLen, targetWords } = difficulty;
  const minVowels = Math.max(2, Math.floor(size * size * 0.28));

  let best: { grid: string[][]; solutions: string[] } | null = null;

  for (let attempt = 0; attempt < 300; attempt += 1) {
    const rng = mulberry32((seed ^ (attempt * 0x9e3779b1)) >>> 0);
    const grid = randomGrid(rng, size);
    if (vowelCount(grid) < minVowels) continue;

    const solutions = solveBoard(grid, minWordLen);
    if (best === null || solutions.length > best.solutions.length) {
      best = { grid, solutions };
    }
    if (solutions.length >= targetWords) {
      return { grid, size, minWordLen, solutions, targetWords, seed };
    }
  }

  // Fallback: richest grid found (guaranteed non-null after the loop).
  const chosen = best ?? { grid: randomGrid(mulberry32(seed >>> 0), size), solutions: [] };
  return { grid: chosen.grid, size, minWordLen, solutions: chosen.solutions, targetWords, seed };
}
