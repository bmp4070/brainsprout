import { mulberry32 } from '../../../shared/lib/rng';
import { isSolved } from './rules';
import { solveMinPours } from './solver';
import { CAPACITY } from './types';
import type { BoardState, DifficultyConfig, Puzzle } from './types';

/** Shuffle+verify attempts before falling back to the constructed board. */
const MAX_ATTEMPTS = 200;
/** Reject boards that are trivially close to solved. */
const MIN_PAR = 3;

/** In-place Fisher-Yates using the supplied PRNG. */
function shuffle(rng: () => number, arr: number[]): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/**
 * Deals `colorCount * CAPACITY` shuffled units into `colorCount` full bottles,
 * followed by `emptyBottles` empty ones.
 */
function shuffledBoard(rng: () => number, difficulty: DifficultyConfig): BoardState {
  const units: number[] = [];
  for (let color = 0; color < difficulty.colorCount; color += 1) {
    for (let i = 0; i < CAPACITY; i += 1) units.push(color);
  }
  shuffle(rng, units);

  const board: BoardState = [];
  for (let b = 0; b < difficulty.colorCount; b += 1) {
    board.push(units.slice(b * CAPACITY, (b + 1) * CAPACITY));
  }
  for (let e = 0; e < difficulty.emptyBottles; e += 1) board.push([]);
  return board;
}

/**
 * Deterministic always-solvable fallback: bottle `i` holds three units of
 * color `i` topped by one unit of color `i+1 (mod n)`. Every color still has
 * exactly CAPACITY units, and the board solves in `n` pours (park the top of
 * the last bottle in an empty, cap each bottle from its neighbour going down,
 * then pour the parked unit back).
 */
function fallbackBoard(difficulty: DifficultyConfig): BoardState {
  const n = difficulty.colorCount;
  const board: BoardState = [];
  for (let i = 0; i < n; i += 1) {
    board.push([i, i, i, (i + 1) % n]);
  }
  for (let e = 0; e < difficulty.emptyBottles; e += 1) board.push([]);
  return board;
}

/**
 * Generates a solvable puzzle for `seed`, deterministically.
 *
 * Strategy: shuffle the color multiset into the non-empty bottles, then VERIFY
 * with the BFS solver. A board is accepted when it is not already solved, is
 * provably solvable, and needs at least MIN_PAR pours. Solvable shuffles are
 * common, so this normally succeeds on the first attempt. Attempts are bounded
 * (no recursion, no unbounded loop); if all of them are rejected we return a
 * hand-constructed board that is solvable by construction, so this never
 * throws and always terminates.
 */
export function generatePuzzle(difficulty: DifficultyConfig, seed: number): Puzzle {
  const rng = mulberry32(seed);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const board = shuffledBoard(rng, difficulty);
    if (isSolved(board)) continue;
    const solved = solveMinPours(board);
    if (!solved.exact || solved.pours < MIN_PAR) continue;
    return { board, difficulty: difficulty.id, seed, par: solved.pours, parExact: true };
  }

  const board = fallbackBoard(difficulty);
  const solved = solveMinPours(board);
  const exact = solved.exact && solved.pours > 0;
  return {
    board,
    difficulty: difficulty.id,
    seed,
    par: exact ? solved.pours : difficulty.colorCount,
    parExact: exact,
  };
}
