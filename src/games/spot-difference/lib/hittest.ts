import type { Difference } from './types';

/**
 * Returns the UNFOUND difference whose circular hitbox contains the point
 * (x, y), or null when the tap lands on none. `found` holds already-found
 * difference ids, which are skipped.
 *
 * Hitboxes are generated pairwise non-overlapping, so at most one unfound
 * difference can contain any point; should radii ever overlap, the FIRST
 * matching (by list order) is returned, which keeps the result deterministic.
 */
export function differenceAt(
  differences: Difference[],
  found: ReadonlySet<string>,
  x: number,
  y: number,
): Difference | null {
  for (const diff of differences) {
    if (found.has(diff.id)) continue;
    const dx = x - diff.cx;
    const dy = y - diff.cy;
    if (dx * dx + dy * dy <= diff.radius * diff.radius) {
      return diff;
    }
  }
  return null;
}
