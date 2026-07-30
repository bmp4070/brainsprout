import { MAZE_THEMES, type MazeTheme } from './themes';

const STORAGE_KEY = 'riddler:maze:theme-index';

function readIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return 0;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed % MAZE_THEMES.length;
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
export function getNextTheme(): MazeTheme {
  return MAZE_THEMES[readIndex()];
}

/** Advances the rotation to the next theme (wrapping around) and returns it. */
export function advanceTheme(): MazeTheme {
  const nextIndex = (readIndex() + 1) % MAZE_THEMES.length;
  writeIndex(nextIndex);
  return MAZE_THEMES[nextIndex];
}
