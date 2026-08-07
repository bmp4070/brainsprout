import { describe, expect, it } from 'vitest';
import { scoreDrop } from './scoring';

describe('scoreDrop', () => {
  it('gives 3 stars for a fast, accurate round', () => {
    const r = scoreDrop(8000, 5, 0);
    expect(r.stars).toBe(3);
    expect(r.score).toBeGreaterThanOrEqual(850);
  });

  it('still gives 3 stars with a single miss', () => {
    expect(scoreDrop(8000, 5, 1).stars).toBe(3);
  });

  it('drops below 3 stars with two or more misses', () => {
    expect(scoreDrop(8000, 5, 2).stars).toBeLessThan(3);
  });

  it('clamps into [300, 1000]', () => {
    expect(scoreDrop(1, 5, 0).score).toBeLessThanOrEqual(1000);
    const worst = scoreDrop(10 * 60 * 1000, 12, 40);
    expect(worst.score).toBeGreaterThanOrEqual(300);
    expect(worst.score).toBeLessThan(400);
  });

  it('never divides by zero on a zero elapsed', () => {
    expect(() => scoreDrop(0, 5, 0)).not.toThrow();
  });

  it('rewards speed once past par', () => {
    expect(scoreDrop(3000, 8, 0).score).toBeGreaterThan(scoreDrop(120000, 8, 0).score);
  });
});
