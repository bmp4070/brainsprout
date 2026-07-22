import { mulberry32, pick, randInt } from '../../../shared/lib/rng';
import type { CellPos, DifficultyConfig, Puzzle } from './types';

const MAX_PLACEMENT_DRAWS = 500;
const PARTITIONS_PER_PLACEMENT = 8;
const MAX_ATTEMPTS = 300;

/**
 * Draws a seeded random N-rooks arrangement: a column permutation indexed by
 * row (so every row and column already holds exactly one cat). Accepts it only
 * if it also satisfies the no-touching rule -- since distinct columns keep
 * non-consecutive rows two-plus apart, that reduces to |col_r - col_{r+1}| >= 2
 * for consecutive rows. Returns cols[row], or null if no valid draw appeared
 * within the try budget.
 */
function findPlacement(rng: () => number, size: number): number[] | null {
  for (let attempt = 0; attempt < MAX_PLACEMENT_DRAWS; attempt++) {
    const cols = Array.from({ length: size }, (_, i) => i);
    for (let i = size - 1; i > 0; i--) {
      const j = randInt(rng, i + 1);
      const tmp = cols[i];
      cols[i] = cols[j];
      cols[j] = tmp;
    }
    let ok = true;
    for (let r = 0; r < size - 1; r++) {
      if (Math.abs(cols[r] - cols[r + 1]) < 2) {
        ok = false;
        break;
      }
    }
    if (ok) return cols;
  }
  return null;
}

/**
 * Partitions the grid into `size` contiguous regions via seeded multi-source
 * flood growth: each region is seeded at its cat cell, then we repeatedly pick
 * a random region that still has an unassigned 4-neighbour and grow it into a
 * random such neighbour. Only regions with a live frontier are ever picked, so
 * the loop always terminates with every cell assigned.
 */
function growRegions(rng: () => number, size: number, catCells: CellPos[]): number[][] {
  const regions = Array.from({ length: size }, () => new Array<number>(size).fill(-1));
  for (let i = 0; i < size; i++) {
    regions[catCells[i].row][catCells[i].col] = i;
  }

  let unassigned = size * size - size;
  while (unassigned > 0) {
    const frontiers = new Map<number, CellPos[]>();
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (regions[row][col] !== -1) continue;
        const neighbours: Array<[number, number]> = [
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1],
        ];
        for (const [nr, nc] of neighbours) {
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
          const region = regions[nr][nc];
          if (region === -1) continue;
          const list = frontiers.get(region) ?? [];
          list.push({ row, col });
          frontiers.set(region, list);
        }
      }
    }

    const candidates = [...frontiers.keys()];
    const region = pick(rng, candidates);
    const cell = pick(rng, frontiers.get(region)!);
    regions[cell.row][cell.col] = region;
    unassigned -= 1;
  }

  return regions;
}

/**
 * Counts the distinct solutions of a region layout, early-exiting once `limit`
 * are found. Backtracks region by region, placing one cat per region and
 * pruning on any shared row, column, or 8-neighbour adjacency with a cat
 * already placed. Exported for testing.
 */
export function countSolutions(regions: number[][], size: number, limit = 2): number {
  const regionCells: CellPos[][] = Array.from({ length: size }, () => []);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      regionCells[regions[row][col]].push({ row, col });
    }
  }

  const placed: CellPos[] = [];
  const usedRows = new Set<number>();
  const usedCols = new Set<number>();
  let count = 0;

  const backtrack = (regionIdx: number): void => {
    if (count >= limit) return;
    if (regionIdx === size) {
      count += 1;
      return;
    }
    for (const cell of regionCells[regionIdx]) {
      if (usedRows.has(cell.row) || usedCols.has(cell.col)) continue;
      let ok = true;
      for (const p of placed) {
        if (Math.max(Math.abs(p.row - cell.row), Math.abs(p.col - cell.col)) === 1) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      placed.push(cell);
      usedRows.add(cell.row);
      usedCols.add(cell.col);
      backtrack(regionIdx + 1);
      placed.pop();
      usedRows.delete(cell.row);
      usedCols.delete(cell.col);
      if (count >= limit) return;
    }
  };

  backtrack(0);
  return count;
}

/**
 * Generates a Cat Nap puzzle deterministically from `seed`: a valid cat
 * placement, a seeded region partition around it, and a uniqueness check that
 * retries partitions (then placements) until exactly one solution exists. The
 * placed cats are, by uniqueness, that one solution. Never throws and never
 * loops forever: after exhausting the attempt budget it restarts from a fresh
 * seed derived from the rng stream.
 */
export function generatePuzzle(difficulty: DifficultyConfig, seed: number): Puzzle {
  const size = difficulty.size;

  // Reseeding loop instead of recursion: exhausting an attempt budget derives
  // a fresh seed from the deterministic stream and tries again, so generation
  // never throws, never loops forever, and never grows the call stack.
  let currentSeed = seed;
  for (;;) {
    const rng = mulberry32(currentSeed);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const cols = findPlacement(rng, size);
      if (cols === null) continue;
      const catCells: CellPos[] = cols.map((col, row) => ({ row, col }));

      for (let p = 0; p < PARTITIONS_PER_PLACEMENT; p++) {
        const regions = growRegions(rng, size, catCells);
        if (countSolutions(regions, size, 2) === 1) {
          return { size, regions, solution: catCells, seed };
        }
      }
    }

    currentSeed = randInt(rng, 0x7fffffff);
  }
}
