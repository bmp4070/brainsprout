import { mulberry32, randInt } from '../../../shared/lib/rng';
import { canPlace, normalize, orientations, placeAt } from './shapes';
import type { Cell, DifficultyConfig, Piece, Placement, Puzzle } from './types';

/** Minimum piece count per difficulty (rejects trivial puzzles). */
const MIN_PIECES: Record<string, number> = { easy: 3, medium: 4, hard: 5 };

/** Bounded outer attempts before falling back to a hand-built puzzle. */
const MAX_ATTEMPTS = 300;

/** Base polyomino shapes, grouped by size. All normalized. */
const DOMINOES: Cell[][] = [[{ r: 0, c: 0 }, { r: 0, c: 1 }]];

const TROMINOES: Cell[][] = [
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }], // I
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }], // L
];

const TETROMINOES: Cell[][] = [
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }], // I
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }], // O
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 1 }], // T
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 2, c: 1 }], // L
  [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }], // S
];

const PENTOMINOES: Cell[][] = [
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 0 }], // P
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 3, c: 1 }], // L
  [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 1 }], // T
  [{ r: 0, c: 0 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 1, c: 2 }], // U
  [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 0 }, { r: 3, c: 0 }], // Y
];

interface TilerPlacement {
  base: Cell[];
  abs: Cell[];
}

/** In-place Fisher-Yates shuffle using the supplied PRNG. */
function shuffle<T>(rng: () => number, arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/**
 * Builds the ordered palette for a difficulty: larger shapes first (to keep the
 * piece count low), with a seeded shuffle within each size band for variety.
 */
function buildPalette(rng: () => number, difficulty: DifficultyConfig): Cell[][] {
  const bands: Cell[][][] = [];
  if (difficulty.id === 'hard') bands.push([...PENTOMINOES]);
  bands.push([...TETROMINOES]);
  bands.push([...TROMINOES]);
  bands.push([...DOMINOES]);
  const palette: Cell[][] = [];
  for (const band of bands) {
    shuffle(rng, band);
    for (const shape of band) palette.push(shape);
  }
  return palette;
}

/** Counts a cell's 4-connected neighbours already inside the region. */
function inRegionNeighbours(inRegion: boolean[][], r: number, c: number): number {
  const rows = inRegion.length;
  const cols = inRegion[0].length;
  let count = 0;
  if (r > 0 && inRegion[r - 1][c]) count += 1;
  if (r < rows - 1 && inRegion[r + 1][c]) count += 1;
  if (c > 0 && inRegion[r][c - 1]) count += 1;
  if (c < cols - 1 && inRegion[r][c + 1]) count += 1;
  return count;
}

/**
 * Grows a connected region of exactly `targetCells` via a seeded flood, biased
 * to prefer candidate cells that already touch many in-region cells so the
 * silhouette stays compact and intentional-looking.
 */
function growRegion(rng: () => number, difficulty: DifficultyConfig): boolean[][] {
  const { rows, cols, targetCells } = difficulty;
  const inRegion: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  );

  const startR = randInt(rng, rows);
  const startC = randInt(rng, cols);
  inRegion[startR][startC] = true;
  let size = 1;

  // Frontier: candidate cells adjacent to the region, keyed to avoid dupes.
  const frontier = new Map<string, Cell>();
  const addFrontier = (r: number, c: number): void => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    if (inRegion[r][c]) return;
    frontier.set(`${r},${c}`, { r, c });
  };
  addFrontier(startR - 1, startC);
  addFrontier(startR + 1, startC);
  addFrontier(startR, startC - 1);
  addFrontier(startR, startC + 1);

  while (size < targetCells && frontier.size > 0) {
    const candidates = [...frontier.values()];
    // Weight by neighbour count squared (+1 base) so compact growth dominates.
    const weights = candidates.map((cell) => {
      const n = inRegionNeighbours(inRegion, cell.r, cell.c);
      return n * n + 1;
    });
    let total = 0;
    for (const w of weights) total += w;
    let roll = rng() * total;
    let chosen = 0;
    for (let i = 0; i < candidates.length; i += 1) {
      roll -= weights[i];
      if (roll < 0) {
        chosen = i;
        break;
      }
    }
    const cell = candidates[chosen];
    frontier.delete(`${cell.r},${cell.c}`);
    inRegion[cell.r][cell.c] = true;
    size += 1;
    addFrontier(cell.r - 1, cell.c);
    addFrontier(cell.r + 1, cell.c);
    addFrontier(cell.r, cell.c - 1);
    addFrontier(cell.r, cell.c + 1);
  }

  return inRegion;
}

/**
 * Backtracking tiler: covers the lowest uncovered region cell each step using
 * palette shapes (largest first). Fails a branch once it would exceed
 * `maxPieces`. Returns one tiling, or null if the region can't be tiled within
 * the piece budget.
 */
function tileRegion(
  region: boolean[][],
  palette: Cell[][],
  maxPieces: number,
): TilerPlacement[] | null {
  const rows = region.length;
  const cols = rows > 0 ? region[0].length : 0;
  const orientCache = palette.map((shape) => orientations(shape));
  const covered = new Set<string>();
  const placed: TilerPlacement[] = [];

  const findTarget = (): Cell | null => {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        if (region[r][c] && !covered.has(`${r},${c}`)) return { r, c };
      }
    }
    return null;
  };

  const recurse = (): boolean => {
    const target = findTarget();
    if (target === null) return true;
    if (placed.length >= maxPieces) return false;

    for (let i = 0; i < palette.length; i += 1) {
      for (const oriented of orientCache[i]) {
        for (const anchor of oriented) {
          const offR = target.r - anchor.r;
          const offC = target.c - anchor.c;
          const abs = oriented.map((cell) => ({ r: cell.r + offR, c: cell.c + offC }));
          if (!canPlace(region, covered, abs)) continue;

          for (const cell of abs) covered.add(`${cell.r},${cell.c}`);
          placed.push({ base: normalize(palette[i]), abs });
          if (recurse()) return true;
          placed.pop();
          for (const cell of abs) covered.delete(`${cell.r},${cell.c}`);
        }
      }
    }
    return false;
  };

  return recurse() ? placed : null;
}

/** True when every placement in the tiling uses an identical base shape. */
function allIdentical(placements: TilerPlacement[]): boolean {
  if (placements.length <= 1) return true;
  const key = (base: Cell[]): string => base.map((cell) => `${cell.r},${cell.c}`).join('|');
  const first = key(placements[0].base);
  return placements.every((p) => key(p.base) === first);
}

/** Assembles pieces + solution from a tiling. */
function buildFromTiling(
  rows: number,
  cols: number,
  region: boolean[][],
  placements: TilerPlacement[],
  seed: number,
): Puzzle {
  const pieces: Piece[] = placements.map((p, id) => ({
    id,
    cells: p.base,
    colorIndex: id % 7,
  }));
  const solution: Placement[] = placements.map((p, id) => ({ pieceId: id, cells: p.abs }));
  return { rows, cols, region, pieces, solution, seed };
}

/**
 * Deterministic, always-terminating hand-built fallback per difficulty: a
 * rectangle-ish region tiled by an explicit, non-identical piece set. Used only
 * when the randomized attempts all fail (rare).
 */
function fallbackPuzzle(difficulty: DifficultyConfig, seed: number): Puzzle {
  const { rows, cols } = difficulty;
  const region: boolean[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => false),
  );
  const O = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }];
  const I4 = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }];
  const DOM = [{ r: 0, c: 0 }, { r: 1, c: 0 }];

  const specs: { base: Cell[]; at: Cell }[] = [];
  if (difficulty.id === 'easy') {
    // 2x5 region: O, O, vertical domino.
    specs.push({ base: O, at: { r: 0, c: 0 } });
    specs.push({ base: O, at: { r: 0, c: 2 } });
    specs.push({ base: DOM, at: { r: 0, c: 4 } });
  } else if (difficulty.id === 'medium') {
    // rows 0-1 cols 0-5 (12) + row 2 cols 0-3 (4): three O + one I.
    specs.push({ base: O, at: { r: 0, c: 0 } });
    specs.push({ base: O, at: { r: 0, c: 2 } });
    specs.push({ base: O, at: { r: 0, c: 4 } });
    specs.push({ base: I4, at: { r: 2, c: 0 } });
  } else {
    // rows 0-3 cols 0-5 (24): four O + two I.
    specs.push({ base: O, at: { r: 0, c: 0 } });
    specs.push({ base: O, at: { r: 0, c: 2 } });
    specs.push({ base: O, at: { r: 0, c: 4 } });
    specs.push({ base: I4, at: { r: 2, c: 0 } });
    specs.push({ base: I4, at: { r: 3, c: 0 } });
    specs.push({ base: O, at: { r: 2, c: 4 } });
  }

  const placements: TilerPlacement[] = specs.map((spec) => {
    const base = normalize(spec.base);
    const abs = placeAt(base, spec.at.r, spec.at.c);
    for (const cell of abs) region[cell.r][cell.c] = true;
    return { base, abs };
  });

  return buildFromTiling(rows, cols, region, placements, seed);
}

/**
 * Generates a solvable puzzle for `difficulty`/`seed`, deterministically.
 *
 * Loop (never recurses, never spins forever): grow a compact random region,
 * tile it largest-shapes-first within `maxPieces`, and accept the first tiling
 * that is non-trivial (piece count within [min, maxPieces], not all-identical).
 * Piece-count lower bounds are automatically met because targetCells / maxShape
 * forces at least the required number of pieces. If every attempt is rejected,
 * fall back to a hand-built puzzle that is valid by construction.
 */
export function generatePuzzle(difficulty: DifficultyConfig, seed: number): Puzzle {
  const rng = mulberry32(seed);
  const minPieces = MIN_PIECES[difficulty.id];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const region = growRegion(rng, difficulty);
    const palette = buildPalette(rng, difficulty);
    const tiling = tileRegion(region, palette, difficulty.maxPieces);
    if (tiling === null) continue;
    if (tiling.length < minPieces || tiling.length > difficulty.maxPieces) continue;
    if (allIdentical(tiling)) continue;
    return buildFromTiling(difficulty.rows, difficulty.cols, region, tiling, seed);
  }

  return fallbackPuzzle(difficulty, seed);
}
