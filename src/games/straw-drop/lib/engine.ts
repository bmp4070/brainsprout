import { DESPAWN_X, DROP_X } from './types';
import type { Bottle } from './types';

/**
 * Pure belt/collision helpers. Real-time animation (requestAnimationFrame,
 * keyboard, sound) lives in the component; everything here is deterministic and
 * unit-testable so the game rules can't silently drift.
 */

/** Moves every bottle left by `beltSpeed * dt` (seconds); returns a new array. */
export function advanceBottles(bottles: Bottle[], beltSpeed: number, dt: number): Bottle[] {
  return bottles.map((b) => ({ ...b, x: b.x - beltSpeed * dt }));
}

/** Drops bottles that have travelled off the left edge. */
export function pruneBottles(bottles: Bottle[]): Bottle[] {
  return bottles.filter((b) => b.x > DESPAWN_X);
}

/**
 * When a straw reaches the belt, finds the UNFILLED bottle whose mouth is under
 * the drop point (nearest wins on ties). Returns its id, or null for a miss
 * (nothing catchable there — an already-filled bottle does not count).
 */
export function findHit(bottles: Bottle[], mouthTolerance: number, dropX: number = DROP_X): number | null {
  let bestId: number | null = null;
  let bestDist = Infinity;
  for (const b of bottles) {
    if (b.filled) continue;
    const dist = Math.abs(b.x - dropX);
    if (dist <= mouthTolerance && dist < bestDist) {
      bestDist = dist;
      bestId = b.id;
    }
  }
  return bestId;
}

/** True once the right-most bottle has moved far enough left to spawn the next. */
export function shouldSpawn(bottles: Bottle[], spawnX: number, gap: number): boolean {
  if (bottles.length === 0) return true;
  const rightMost = bottles.reduce((max, b) => Math.max(max, b.x), -Infinity);
  return spawnX - rightMost >= gap;
}
