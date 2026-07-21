/**
 * Seedable pseudo-random number generator (mulberry32) and helpers.
 * Deterministic given the same seed, so puzzles can be regenerated
 * and tested reliably.
 */

/**
 * Creates a mulberry32 PRNG function seeded with `seed`.
 * Returns a function that yields floats in [0, 1) on each call.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rng(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a random integer in [0, maxExclusive). */
export function randInt(rng: () => number, maxExclusive: number): number {
  if (maxExclusive <= 0) {
    throw new Error('randInt: maxExclusive must be > 0');
  }
  return Math.floor(rng() * maxExclusive);
}

/** Picks a uniformly random element from a non-empty array. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) {
    throw new Error('pick: array must not be empty');
  }
  return arr[randInt(rng, arr.length)];
}
