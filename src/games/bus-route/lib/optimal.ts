import { manhattanDist, routeLength } from './geometry';
import type { Layout } from './types';

export interface OptimalRoute {
  order: number[];
  length: number;
}

/**
 * Exact optimal closed tour (school -> every stop once -> school) by brute
 * force over all permutations of stop ids. N <= 9, so at most 9! = 362,880
 * permutations — trivial in milliseconds.
 *
 * A tour and its reverse have identical length, so we enumerate only
 * permutations where order[0] < order[last], halving the work. With N <= 1 the
 * constraint is vacuous and the single permutation is returned directly.
 */
export function optimalRoute(layout: Layout): OptimalRoute {
  const ids = layout.stops.map((s) => s.id);
  const n = ids.length;

  if (n === 0) return { order: [], length: 0 };
  if (n === 1) {
    return { order: [ids[0]], length: routeLength(layout.school, layout.stops, ids, true) };
  }

  // Precompute a distance matrix once (index n = the school) instead of
  // resolving stops and recomputing legs inside the permutation hot loop —
  // keeps the synchronous 9-stop solve fast even on low-end tablets.
  const points = [...layout.stops, layout.school];
  const matrix: number[][] = points.map((a) => points.map((b) => manhattanDist(a, b)));
  const SCHOOL = n;

  let bestOrder: number[] = ids.slice();
  let bestLength = Infinity;

  const perm: number[] = []; // stop INDICES into layout.stops
  const used = new Array<boolean>(n).fill(false);
  let runningLength = 0;

  const recurse = (): void => {
    if (runningLength >= bestLength) return; // branch-and-bound prune
    if (perm.length === n) {
      // Direction-halving: skip the mirror image of every tour.
      if (ids[perm[0]] < ids[perm[perm.length - 1]]) {
        const length = runningLength + matrix[perm[perm.length - 1]][SCHOOL];
        if (length < bestLength) {
          bestLength = length;
          bestOrder = perm.map((i) => ids[i]);
        }
      }
      return;
    }
    const prev = perm.length === 0 ? SCHOOL : perm[perm.length - 1];
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      perm.push(i);
      const leg = matrix[prev][i];
      runningLength += leg;
      recurse();
      runningLength -= leg;
      perm.pop();
      used[i] = false;
    }
  };

  recurse();
  return { order: bestOrder, length: bestLength };
}
