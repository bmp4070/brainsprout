import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getNextTheme, advanceTheme } from './rotation';
import { THEMES } from './themes';

const STORAGE_KEY = 'riddler:spot-difference:theme-index';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new MemoryStorage());
});

describe('theme rotation', () => {
  it('defaults to the first theme when nothing is stored', () => {
    expect(getNextTheme()).toBe(THEMES[0]);
  });

  it('advances to the next theme in order and persists the index', () => {
    expect(getNextTheme()).toBe(THEMES[0]);
    const second = advanceTheme();
    expect(second).toBe(THEMES[1]);
    expect(getNextTheme()).toBe(THEMES[1]);
  });

  it('wraps around after the last theme', () => {
    for (let i = 0; i < THEMES.length - 1; i++) {
      advanceTheme();
    }
    expect(getNextTheme()).toBe(THEMES[THEMES.length - 1]);
    const wrapped = advanceTheme();
    expect(wrapped).toBe(THEMES[0]);
    expect(getNextTheme()).toBe(THEMES[0]);
  });

  it('treats a missing key as index 0', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getNextTheme()).toBe(THEMES[0]);
  });

  it('treats corrupt/non-numeric storage as index 0', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-number');
    expect(getNextTheme()).toBe(THEMES[0]);

    localStorage.setItem(STORAGE_KEY, '-5');
    expect(getNextTheme()).toBe(THEMES[0]);
  });

  it('wraps a stored index that is out of range', () => {
    localStorage.setItem(STORAGE_KEY, String(THEMES.length + 2));
    expect(getNextTheme()).toBe(THEMES[2 % THEMES.length]);
  });

  it('is safe when localStorage throws on read and write', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    expect(getNextTheme()).toBe(THEMES[0]);
    expect(() => advanceTheme()).not.toThrow();
    expect(advanceTheme()).toBe(THEMES[1 % THEMES.length]);
  });

  it('keeps a 7-entry palette on every theme so colorIndex 0..6 resolves', () => {
    for (const theme of THEMES) {
      expect(theme.palette).toHaveLength(7);
    }
  });
});
