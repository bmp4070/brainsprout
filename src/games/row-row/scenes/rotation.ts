import type { RowRowScene } from './types';
import { scenes } from './index';

const STORAGE_KEY = 'riddler:row-row:scene-index';

function readIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return 0;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed % scenes.length;
  } catch {
    return 0;
  }
}

function writeIndex(index: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(index));
  } catch {
    // Ignore write failures (e.g. storage disabled/full); rotation just
    // won't persist across visits, but the current session still works.
  }
}

/** Returns the scene the rotation currently points to, without advancing it. */
export function getNextScene(): RowRowScene {
  return scenes[readIndex()];
}

/** Advances the rotation to the next scene (wrapping around) and returns it. */
export function advanceScene(): RowRowScene {
  const nextIndex = (readIndex() + 1) % scenes.length;
  writeIndex(nextIndex);
  return scenes[nextIndex];
}
