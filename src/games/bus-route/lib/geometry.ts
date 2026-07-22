import type { Point, Stop } from './types';

/** Euclidean distance between two points. Kept for callers that measure a
 * single, already axis-aligned segment (e.g. the drive-animation code walks
 * a polyline of horizontal/vertical segments, where Euclidean length and
 * Manhattan length of one segment are identical). Route scoring itself uses
 * `manhattanDist` -- see `routeLength` below. */
export function dist(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Manhattan (L1 / taxicab) distance between two points: |dx| + |dy|.
 *
 * This is the true cost of a leg on the street grid, since the bus can only
 * travel along horizontal and vertical roads, never diagonally.
 */
export function manhattanDist(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/**
 * The axis-aligned "corner path" from `a` to `b`: a single horizontal-first
 * bend, `[a, {x: b.x, y: a.y}, b]`.
 *
 * Degenerate cases collapse the corner: if `a` and `b` share an axis (same x
 * or same y) the direct two-point segment `[a, b]` is already axis-aligned,
 * and if `a` and `b` are identical the path is just `[a]`.
 *
 * Any monotone staircase path from `a` to `b` (in any order of horizontal and
 * vertical steps) has the same total length -- Manhattan distance is
 * insensitive to path shape as long as it's monotone in both axes. So this
 * particular horizontal-first bend is an arbitrary but *honest* visualization
 * of the scored distance: drawing it never over- or under-states the
 * Manhattan length between the two points.
 */
export function lPath(a: Point, b: Point): Point[] {
  if (a.x === b.x && a.y === b.y) return [a];
  if (a.x === b.x || a.y === b.y) return [a, b];
  return [a, { x: b.x, y: a.y }, b];
}

/**
 * Length of the route school -> stops (in `order`) -> (optionally) back to school.
 *
 * `order` is a list of stop ids giving the visit sequence. The path always
 * starts at the school and walks through the referenced stops in order. When
 * `closeTour` is true a final leg back to the school is added (the closing leg
 * of a full tour). An empty order yields 0 (open) or 0 if closed with no stops
 * (school -> school). Ids not present in `stops` are skipped defensively.
 *
 * Distances are Manhattan, matching the street-grid movement rule: the bus
 * can only drive along horizontal/vertical roads.
 */
export function routeLength(
  school: Point,
  stops: Stop[],
  order: number[],
  closeTour: boolean,
): number {
  if (order.length === 0) return 0;

  const byId = new Map<number, Stop>();
  for (const stop of stops) byId.set(stop.id, stop);

  let total = 0;
  let prev: Point = school;
  for (const id of order) {
    const stop = byId.get(id);
    if (stop === undefined) continue;
    total += manhattanDist(prev, stop);
    prev = stop;
  }

  if (closeTour) {
    total += manhattanDist(prev, school);
  }
  return total;
}
