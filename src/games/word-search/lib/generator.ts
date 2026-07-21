import { mulberry32, randInt, pick } from './rng';
import type {
  CellPos,
  DifficultyConfig,
  Direction,
  Placement,
  Puzzle,
  WordTheme,
} from './types';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_PLACEMENT_ATTEMPTS = 100;
const MAX_RESTARTS = 10;

/** Selects `count` words from `pool` without replacement, using the seeded rng. */
function selectRandomWords(
  rng: () => number,
  pool: readonly string[],
  count: number,
): string[] {
  const remaining = [...pool];
  const selected: string[] = [];
  const n = Math.min(count, remaining.length);
  for (let i = 0; i < n; i++) {
    const index = randInt(rng, remaining.length);
    selected.push(remaining[index]);
    remaining.splice(index, 1);
  }
  return selected;
}

/** Computes the ordered cell path for a word starting at (row, col) heading in `direction`. */
function computeCells(
  row: number,
  col: number,
  direction: Direction,
  length: number,
): CellPos[] {
  const cells: CellPos[] = [];
  for (let i = 0; i < length; i++) {
    cells.push({ row: row + direction.dr * i, col: col + direction.dc * i });
  }
  return cells;
}

function inBounds(pos: CellPos, size: number): boolean {
  return pos.row >= 0 && pos.row < size && pos.col >= 0 && pos.col < size;
}

interface AttemptResult {
  success: boolean;
  grid: (string | null)[][];
  placements: Placement[];
  /** Index into `words` of the word that failed to place; -1 when success is true. */
  failedIndex: number;
}

/** Attempts to place every word in `words` (longest-first) into a fresh grid. */
function attemptPlaceAll(
  rng: () => number,
  size: number,
  words: readonly string[],
  directions: readonly Direction[],
): AttemptResult {
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null),
  );
  const placements: Placement[] = [];

  for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
    const word = words[wordIndex];
    let placed = false;

    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const direction = pick(rng, directions);
      const startRow = randInt(rng, size);
      const startCol = randInt(rng, size);
      const cells = computeCells(startRow, startCol, direction, word.length);

      const fits = cells.every((cell, i) => {
        if (!inBounds(cell, size)) return false;
        const existing = grid[cell.row][cell.col];
        return existing === null || existing === word[i];
      });

      if (fits) {
        cells.forEach((cell, i) => {
          grid[cell.row][cell.col] = word[i];
        });
        placements.push({ word, cells });
        placed = true;
        break;
      }
    }

    if (!placed) {
      return { success: false, grid, placements, failedIndex: wordIndex };
    }
  }

  return { success: true, grid, placements, failedIndex: -1 };
}

/** Fills any remaining empty cells in `grid` with random uppercase letters. */
function fillRandomLetters(
  rng: () => number,
  grid: (string | null)[][],
): string[][] {
  return grid.map((row) =>
    row.map((cell) => cell ?? ALPHABET[randInt(rng, ALPHABET.length)]),
  );
}

/**
 * Generates a word-search puzzle for the given theme, difficulty, and seed.
 * Deterministic: the same inputs always produce the same puzzle.
 */
export function generatePuzzle(
  theme: WordTheme,
  difficulty: DifficultyConfig,
  seed: number,
): Puzzle {
  const rng = mulberry32(seed);
  const size = difficulty.gridSize;
  const pool = theme.words[difficulty.id] ?? [];
  const wordCount = Math.min(difficulty.wordCount, pool.length);

  const selected = selectRandomWords(rng, pool, wordCount);
  let words = [...selected].sort((a, b) => b.length - a.length);

  while (words.length > 0) {
    let lastFailedIndex = -1;
    for (let restart = 0; restart < MAX_RESTARTS; restart++) {
      const result = attemptPlaceAll(rng, size, words, difficulty.directions);
      if (result.success) {
        return {
          size,
          grid: fillRandomLetters(rng, result.grid),
          placements: result.placements,
          seed,
        };
      }
      lastFailedIndex = result.failedIndex;
    }
    // Drop the word that kept failing to place and try again with a smaller set.
    if (lastFailedIndex >= 0) {
      words = words.filter((_, i) => i !== lastFailedIndex);
    } else {
      // Should not happen, but avoid an infinite loop if it somehow does.
      words = words.slice(0, -1);
    }
  }

  // No words could be placed at all; return a grid of random letters with no placements.
  const emptyGrid: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null),
  );
  return {
    size,
    grid: fillRandomLetters(rng, emptyGrid),
    placements: [],
    seed,
  };
}
