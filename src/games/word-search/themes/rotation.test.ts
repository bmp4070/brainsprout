import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getNextTheme, advanceTheme } from './rotation';
import { themes } from './index';

const STORAGE_KEY = 'riddler:word-search:theme-index';

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
    expect(getNextTheme()).toBe(themes[0]);
  });

  it('advances to the next theme in order and persists the index', () => {
    expect(getNextTheme()).toBe(themes[0]);
    const second = advanceTheme();
    expect(second).toBe(themes[1]);
    expect(getNextTheme()).toBe(themes[1]);

    const third = advanceTheme();
    expect(third).toBe(themes[2]);
    expect(getNextTheme()).toBe(themes[2]);
  });

  it('wraps around after the last theme', () => {
    for (let i = 0; i < themes.length - 1; i++) {
      advanceTheme();
    }
    expect(getNextTheme()).toBe(themes[themes.length - 1]);
    const wrapped = advanceTheme();
    expect(wrapped).toBe(themes[0]);
    expect(getNextTheme()).toBe(themes[0]);
  });

  it('treats a missing key as index 0', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getNextTheme()).toBe(themes[0]);
  });

  it('treats corrupt/non-numeric storage as index 0', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-number');
    expect(getNextTheme()).toBe(themes[0]);

    localStorage.setItem(STORAGE_KEY, '-5');
    expect(getNextTheme()).toBe(themes[0]);
  });

  it('wraps a stored index that is out of range', () => {
    localStorage.setItem(STORAGE_KEY, String(themes.length + 2));
    expect(getNextTheme()).toBe(themes[2 % themes.length]);
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
    expect(getNextTheme()).toBe(themes[0]);
    expect(() => advanceTheme()).not.toThrow();
    // Writes are silently dropped, so every read still sees index 0, and
    // advancing from 0 always yields the second theme.
    expect(advanceTheme()).toBe(themes[1 % themes.length]);
  });
});
