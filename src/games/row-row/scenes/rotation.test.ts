import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getNextScene, advanceScene } from './rotation';
import { scenes } from './index';

const STORAGE_KEY = 'riddler:row-row:scene-index';

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

describe('row-row scene rotation', () => {
  it('defaults to the first scene when nothing is stored', () => {
    expect(getNextScene()).toBe(scenes[0]);
  });

  it('advances to the next scene in order and persists the index', () => {
    expect(getNextScene()).toBe(scenes[0]);
    const second = advanceScene();
    expect(second).toBe(scenes[1]);
    expect(getNextScene()).toBe(scenes[1]);
  });

  it('wraps around after the last scene', () => {
    for (let i = 0; i < scenes.length - 1; i++) {
      advanceScene();
    }
    expect(getNextScene()).toBe(scenes[scenes.length - 1]);
    const wrapped = advanceScene();
    expect(wrapped).toBe(scenes[0]);
    expect(getNextScene()).toBe(scenes[0]);
  });

  it('treats a missing key as index 0', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getNextScene()).toBe(scenes[0]);
  });

  it('treats corrupt/non-numeric storage as index 0', () => {
    localStorage.setItem(STORAGE_KEY, 'not-a-number');
    expect(getNextScene()).toBe(scenes[0]);

    localStorage.setItem(STORAGE_KEY, '-5');
    expect(getNextScene()).toBe(scenes[0]);
  });

  it('wraps a stored index that is out of range', () => {
    localStorage.setItem(STORAGE_KEY, String(scenes.length + 2));
    expect(getNextScene()).toBe(scenes[2 % scenes.length]);
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
    expect(getNextScene()).toBe(scenes[0]);
    expect(() => advanceScene()).not.toThrow();
    expect(advanceScene()).toBe(scenes[1 % scenes.length]);
  });
});
