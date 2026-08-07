import { describe, expect, it } from 'vitest';
import { scoreCrossword } from './scoring';

describe('scoreCrossword', () => {
  it('gives 3 stars for a clean, quick solve', () => {
    const r = scoreCrossword(10000, 4, 0, 0);
    expect(r.stars).toBe(3);
    expect(r.score).toBeGreaterThanOrEqual(850);
  });

  it('drops below 3 stars after a mistake', () => {
    expect(scoreCrossword(10000, 4, 1, 0).stars).toBeLessThan(3);
  });

  it('drops below 3 stars after a hint', () => {
    expect(scoreCrossword(10000, 4, 0, 1).stars).toBeLessThan(3);
  });

  it('clamps into [300, 1000]', () => {
    expect(scoreCrossword(1, 2, 0, 0).score).toBeLessThanOrEqual(1000);
    const worst = scoreCrossword(10 * 60 * 1000, 4, 20, 20);
    expect(worst.score).toBeGreaterThanOrEqual(300);
    expect(worst.score).toBeLessThan(400);
    expect(worst.stars).toBe(1);
  });

  it('never divides by zero on a zero elapsed', () => {
    expect(() => scoreCrossword(0, 4, 0, 0)).not.toThrow();
  });

  it('rewards speed once past par for the same accuracy', () => {
    // par for 4 blanks = 60s; compare a fast solve vs. one well beyond par.
    expect(scoreCrossword(3000, 4, 0, 0).score).toBeGreaterThan(scoreCrossword(200000, 4, 0, 0).score);
  });
});
