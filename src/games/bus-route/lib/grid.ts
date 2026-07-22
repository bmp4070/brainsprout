import type { Point } from './types';

/**
 * The town is laid out on a street grid: roads run only horizontally and
 * vertically, spaced `GRID_SPACING` map-units apart within the 0..100 SVG
 * viewBox. Houses and the school sit on intersections (coordinates that are
 * multiples of `GRID_SPACING`), and the bus may only travel along the roads
 * -- never diagonally across a block.
 */
export const GRID_SPACING = 10;

/** The map-unit coordinates at which road lines run, on both axes. */
export const GRID_LINES: number[] = [10, 20, 30, 40, 50, 60, 70, 80, 90];

/**
 * Chebyshev ("king move") distance between two intersections, expressed in
 * whole grid steps. Only meaningful for points that already lie on grid
 * intersections (coordinates that are multiples of `GRID_SPACING`).
 */
export function chebyshevSteps(a: Point, b: Point): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) / GRID_SPACING;
}
