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

describe('row-row storage', () => {
  it('returns null when nothing is stored', () => {
    expect(getBest('sunny-fjord', 'easy')).toBeNull();
  });

  it('records the first result as the best', () => {
    const { best, isNewBest } = recordResult('sunny-fjord', 'easy', 900);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestScore: 900, plays: 1 });
    expect(getBest('sunny-fjord', 'easy')).toEqual({ bestScore: 900, plays: 1 });
  });

  it('only overwrites bestScore when a higher score is recorded', () => {
    recordResult('sunny-fjord', 'medium', 800);
    const worse = recordResult('sunny-fjord', 'medium', 700);
    expect(worse.isNewBest).toBe(false);
    expect(worse.best).toEqual({ bestScore: 800, plays: 2 });

    const better = recordResult('sunny-fjord', 'medium', 950);
    expect(better.isNewBest).toBe(true);
    expect(better.best).toEqual({ bestScore: 950, plays: 3 });
  });

  it('keeps scene/difficulty records independent', () => {
    recordResult('sunny-fjord', 'easy', 500);
    recordResult('sunset-fjord', 'easy', 600);
    expect(getBest('sunny-fjord', 'easy')).toEqual({ bestScore: 500, plays: 1 });
    expect(getBest('sunset-fjord', 'easy')).toEqual({ bestScore: 600, plays: 1 });
  });

  it('treats malformed JSON as absent', () => {
    localStorage.setItem('riddler:row-row:best:sunny-fjord:easy', '{not json');
    expect(getBest('sunny-fjord', 'easy')).toBeNull();
  });

  it('treats malformed shape as absent', () => {
    localStorage.setItem(
      'riddler:row-row:best:sunny-fjord:easy',
      JSON.stringify({ foo: 'bar' }),
    );
    expect(getBest('sunny-fjord', 'easy')).toBeNull();
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
    expect(getBest('sunny-fjord', 'easy')).toBeNull();
    const { best, isNewBest } = recordResult('sunny-fjord', 'easy', 1234);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestScore: 1234, plays: 1 });
  });
});
