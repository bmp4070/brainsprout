import type { Theme } from './themes';
import { THEMES } from './themes';

const STORAGE_KEY = 'riddler:spot-difference:theme-index';

function readIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return 0;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed % THEMES.length;
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

/** Returns the theme the rotation currently points to, without advancing it. */
export function getNextTheme(): Theme {
  return THEMES[readIndex()];
}

/** Advances the rotation to the next theme (wrapping around) and returns it. */
export function advanceTheme(): Theme {
  const nextIndex = (readIndex() + 1) % THEMES.length;
  writeIndex(nextIndex);
  return THEMES[nextIndex];
}
