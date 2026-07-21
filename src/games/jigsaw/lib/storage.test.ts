import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBest, recordResult } from './storage';

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

describe('jigsaw storage', () => {
  it('returns null when nothing is stored', () => {
    expect(getBest('friendly-dragon', 'easy')).toBeNull();
  });

  it('records the first result as the best', () => {
    const { best, isNewBest } = recordResult('friendly-dragon', 'easy', 5000);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestMs: 5000, plays: 1 });
    expect(getBest('friendly-dragon', 'easy')).toEqual({ bestMs: 5000, plays: 1 });
  });

  it('only overwrites bestMs when a lower time is recorded', () => {
    recordResult('friendly-dragon', 'medium', 8000);
    const slower = recordResult('friendly-dragon', 'medium', 9000);
    expect(slower.isNewBest).toBe(false);
    expect(slower.best).toEqual({ bestMs: 8000, plays: 2 });

    const faster = recordResult('friendly-dragon', 'medium', 4000);
    expect(faster.isNewBest).toBe(true);
    expect(faster.best).toEqual({ bestMs: 4000, plays: 3 });
  });

  it('keeps scene/difficulty records independent', () => {
    recordResult('friendly-dragon', 'easy', 1000);
    recordResult('outer-space', 'easy', 2000);
    expect(getBest('friendly-dragon', 'easy')).toEqual({ bestMs: 1000, plays: 1 });
    expect(getBest('outer-space', 'easy')).toEqual({ bestMs: 2000, plays: 1 });
  });

  it('treats malformed JSON as absent', () => {
    localStorage.setItem('riddler:jigsaw:best:friendly-dragon:easy', '{not json');
    expect(getBest('friendly-dragon', 'easy')).toBeNull();
  });

  it('treats malformed shape as absent', () => {
    localStorage.setItem(
      'riddler:jigsaw:best:friendly-dragon:easy',
      JSON.stringify({ foo: 'bar' }),
    );
    expect(getBest('friendly-dragon', 'easy')).toBeNull();
  });

  it('is safe when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    expect(getBest('friendly-dragon', 'easy')).toBeNull();
    const { best, isNewBest } = recordResult('friendly-dragon', 'easy', 1234);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestMs: 1234, plays: 1 });
  });
});
