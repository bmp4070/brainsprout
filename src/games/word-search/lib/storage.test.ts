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

describe('storage', () => {
  it('returns null when nothing is stored', () => {
    expect(getBest('wings-of-fire', 'easy')).toBeNull();
  });

  it('records the first result as the best', () => {
    const { best, isNewBest } = recordResult('wings-of-fire', 'easy', 5000);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestMs: 5000, plays: 1 });
    expect(getBest('wings-of-fire', 'easy')).toEqual({ bestMs: 5000, plays: 1 });
  });

  it('only overwrites bestMs when a lower time is recorded', () => {
    recordResult('wings-of-fire', 'medium', 8000);
    const slower = recordResult('wings-of-fire', 'medium', 9000);
    expect(slower.isNewBest).toBe(false);
    expect(slower.best).toEqual({ bestMs: 8000, plays: 2 });

    const faster = recordResult('wings-of-fire', 'medium', 4000);
    expect(faster.isNewBest).toBe(true);
    expect(faster.best).toEqual({ bestMs: 4000, plays: 3 });
  });

  it('keeps theme/difficulty records independent', () => {
    recordResult('wings-of-fire', 'easy', 1000);
    recordResult('wings-of-fire', 'hard', 2000);
    expect(getBest('wings-of-fire', 'easy')).toEqual({ bestMs: 1000, plays: 1 });
    expect(getBest('wings-of-fire', 'hard')).toEqual({ bestMs: 2000, plays: 1 });
  });

  it('treats malformed JSON as absent', () => {
    localStorage.setItem('riddler:word-search:best:wings-of-fire:easy', '{not json');
    expect(getBest('wings-of-fire', 'easy')).toBeNull();
  });

  it('treats malformed shape as absent', () => {
    localStorage.setItem(
      'riddler:word-search:best:wings-of-fire:easy',
      JSON.stringify({ foo: 'bar' }),
    );
    expect(getBest('wings-of-fire', 'easy')).toBeNull();
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
    expect(getBest('wings-of-fire', 'easy')).toBeNull();
    const { best, isNewBest } = recordResult('wings-of-fire', 'easy', 1234);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestMs: 1234, plays: 1 });
  });
});
