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

describe('potion-sort storage', () => {
  it('returns null when nothing is stored', () => {
    expect(getBest('easy')).toBeNull();
  });

  it('records the first result as the best', () => {
    const { best, isNewBest } = recordResult('easy', 700);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestScore: 700, plays: 1 });
    expect(getBest('easy')).toEqual({ bestScore: 700, plays: 1 });
  });

  it('only overwrites bestScore when a HIGHER score is recorded', () => {
    recordResult('medium', 600);
    const lower = recordResult('medium', 500);
    expect(lower.isNewBest).toBe(false);
    expect(lower.best).toEqual({ bestScore: 600, plays: 2 });

    const higher = recordResult('medium', 900);
    expect(higher.isNewBest).toBe(true);
    expect(higher.best).toEqual({ bestScore: 900, plays: 3 });
  });

  it('keeps difficulty records independent', () => {
    recordResult('easy', 400);
    recordResult('hard', 800);
    expect(getBest('easy')).toEqual({ bestScore: 400, plays: 1 });
    expect(getBest('hard')).toEqual({ bestScore: 800, plays: 1 });
  });

  it('treats malformed JSON as absent', () => {
    localStorage.setItem('riddler:potion-sort:best:easy', '{not json');
    expect(getBest('easy')).toBeNull();
  });

  it('treats malformed shape as absent', () => {
    localStorage.setItem('riddler:potion-sort:best:easy', JSON.stringify({ foo: 'bar' }));
    expect(getBest('easy')).toBeNull();
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
    expect(getBest('easy')).toBeNull();
    const { best, isNewBest } = recordResult('easy', 555);
    expect(isNewBest).toBe(true);
    expect(best).toEqual({ bestScore: 555, plays: 1 });
  });
});
