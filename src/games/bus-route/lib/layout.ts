import { mulberry32, pick } from '../../../shared/lib/rng';
import { chebyshevSteps, GRID_SPACING } from './grid';
import type { DifficultyConfig, Layout, Point, Stop } from './types';

/** The school sits on an intersection near the bottom-center of the map, below the stop band. */
export const SCHOOL: Point = { x: 50, y: 80 };

/**
 * Stops are sampled from intersections within this axis-aligned box (map
 * units). Both bounds are multiples of `GRID_SPACING`, and the box excludes
 * the school's row (y=80) entirely, so a stop can never land exactly on the
 * school's intersection.
 */
export const STOP_BOUNDS = { minX: 10, maxX: 90, minY: 10, maxY: 70 } as const;

/**
 * Minimum pairwise separation between any two stops (and between a stop and
 * the school), in Chebyshev grid steps. At `GRID_SPACING` = 10 map-units per
 * step, a Chebyshev distance of 2 (20 map-units) guarantees the r=7 tap
 * circles drawn around each house never overlap (two circles 10 units apart
 * -- i.e. adjacent intersections -- would overlap since 7 + 7 > 10; twenty
 * units apart they never touch).
 */
export const REQUIRED_SEPARATION = 2;

/**
 * Absolute floor the relaxation fallback may never drop below. Only ever
 * reached in pathological cases (see `generateLayout`); with the node pool
 * used here it is never actually needed for stopCount <= 9, but it exists so
 * placement can never throw or loop forever.
 */
const FALLBACK_SEPARATION = 1;

const PER_STEP_CAP = 400;
const ABSOLUTE_CAP = 20000;

/** Every intersection stops may be placed on: a grid of (maxX-minX)/step + 1
 * by (maxY-minY)/step + 1 nodes within `STOP_BOUNDS`. */
function gridNodePool(): Point[] {
  const { minX, maxX, minY, maxY } = STOP_BOUNDS;
  const nodes: Point[] = [];
  for (let x = minX; x <= maxX; x += GRID_SPACING) {
    for (let y = minY; y <= maxY; y += GRID_SPACING) {
      nodes.push({ x, y });
    }
  }
  return nodes;
}

function farEnough(candidate: Point, placed: Point[], required: number): boolean {
  if (chebyshevSteps(candidate, SCHOOL) < required) return false;
  for (const p of placed) {
    if (chebyshevSteps(candidate, p) < required) return false;
  }
  return true;
}

/**
 * Generates a deterministic layout for `difficulty` seeded by `seed`.
 *
 * Stops are placed on grid intersections via rejection sampling, enforcing a
 * minimum pairwise separation (from each other and the school) of
 * `REQUIRED_SEPARATION` Chebyshev grid steps. If a stop cannot be placed
 * within `PER_STEP_CAP` attempts the required separation is relaxed by one
 * step (never below `FALLBACK_SEPARATION`) and sampling continues. An
 * absolute attempt cap guarantees termination without ever throwing.
 */
export function generateLayout(difficulty: DifficultyConfig, seed: number): Layout {
  const rng = mulberry32(seed);
  const pool = gridNodePool();

  const placed: Point[] = [];
  for (let i = 0; i < difficulty.stopCount; i++) {
    let required = REQUIRED_SEPARATION;
    let attempts = 0;
    let chosen: Point | null = null;
    while (chosen === null) {
      const candidate = pick(rng, pool);
      attempts++;
      if (farEnough(candidate, placed, required)) {
        chosen = candidate;
        break;
      }
      if (attempts % PER_STEP_CAP === 0) {
        required = Math.max(FALLBACK_SEPARATION, required - 1);
      }
      if (attempts >= ABSOLUTE_CAP) {
        // Guaranteed termination. In practice unreachable: the node pool is
        // large enough that a success fires long before this cap for any
        // stopCount <= 9.
        chosen = candidate;
        break;
      }
    }
    placed.push(chosen);
  }

  const stops: Stop[] = placed.map((p, id) => ({ id, x: p.x, y: p.y }));
  return { school: { ...SCHOOL }, stops, seed };
}
