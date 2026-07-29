import type { Backdrop } from './types';

/** Backdrops cycle in this order each round. */
const ORDER: Backdrop[] = ['diamond', 'rhombus'];
const STORAGE_KEY = 'riddler:shape-fit:backdrop-index';

function readIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const n = raw === null ? 0 : Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n % ORDER.length;
  } catch {
    return 0;
  }
}

function writeIndex(index: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(index % ORDER.length));
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

/** The backdrop for the round that's about to start (does not advance). */
export function getNextBackdrop(): Backdrop {
  return ORDER[readIndex()];
}

/** Advances the rotation and returns the new current backdrop. */
export function advanceBackdrop(): Backdrop {
  const next = (readIndex() + 1) % ORDER.length;
  writeIndex(next);
  return ORDER[next];
}
