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

describe('math-sprout storage', () => {
  it('returns null when nothing is stored', () => {
    expect(getBest('subtract', 'easy')).toBeNull();
  });

  it('records the first result as the best', () => {
    const { best, isNewBest } = recordResult('subtract', 'easy', 700);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestScore: 700, plays: 1 });
    expect(getBest('subtract', 'easy')).toEqual({ bestScore: 700, plays: 1 });
  });

  it('only overwrites bestScore when a HIGHER score is recorded', () => {
    recordResult('multiply', 'medium', 600);
    const lower = recordResult('multiply', 'medium', 500);
    expect(lower.isNewBest).toBe(false);
    expect(lower.best).toEqual({ bestScore: 600, plays: 2 });

    const higher = recordResult('multiply', 'medium', 900);
    expect(higher.isNewBest).toBe(true);
    expect(higher.best).toEqual({ bestScore: 900, plays: 3 });
  });

  it('keeps operation/difficulty records independent', () => {
    recordResult('subtract', 'easy', 400);
    recordResult('subtract', 'hard', 800);
    recordResult('multiply', 'easy', 250);
    expect(getBest('subtract', 'easy')).toEqual({ bestScore: 400, plays: 1 });
    expect(getBest('subtract', 'hard')).toEqual({ bestScore: 800, plays: 1 });
    expect(getBest('multiply', 'easy')).toEqual({ bestScore: 250, plays: 1 });
    expect(getBest('multiply', 'hard')).toBeNull();
  });

  it('treats malformed JSON as absent', () => {
    localStorage.setItem('riddler:math-sprout:best:subtract:easy', '{not json');
    expect(getBest('subtract', 'easy')).toBeNull();
  });

  it('treats malformed shape as absent', () => {
    localStorage.setItem('riddler:math-sprout:best:subtract:easy', JSON.stringify({ foo: 'bar' }));
    expect(getBest('subtract', 'easy')).toBeNull();
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
    expect(getBest('subtract', 'easy')).toBeNull();
    const { best, isNewBest } = recordResult('subtract', 'easy', 555);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestScore: 555, plays: 1 });
  });
});
