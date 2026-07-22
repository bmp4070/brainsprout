/**
 * Distance units gained per millisecond of correctly-timed rowing. Shared
 * between the difficulty tuning (lib/types.ts) and the reducer
 * (hooks/useRowRow.ts) so `totalDistance` and the sim step stay consistent.
 */
export const SPEED_PER_MS = 1;

/** Fraction of SPEED_PER_MS lost per ms when rowing during a rest beat. */
export const BACKSLIDE_FACTOR = 0.4;

/** Fixed "get ready" rest segment that always opens a pattern. */
export const LEAD_IN_MS = 800;

/** Hard tier only: occasional short "trick" rest segment duration. */
export const HARD_TRICK_MS = 250;

/** Hard tier only: probability a given rest segment becomes a trick segment. */
export const HARD_TRICK_PROBABILITY = 0.3;
