import { describe, expect, it } from 'vitest';
import { scoreSort } from './scoring';

describe('potion-sort scoring', () => {
  it('awards 3 stars and a perfect score when pours match par with no hints', () => {
    const result = scoreSort(20, 20, 0);
    expect(result.ratio).toBeCloseTo(1, 9);
    expect(result.stars).toBe(3);
    expect(result.score).toBe(1000);
  });

  it('awards 3 stars right at the 1.15 ratio boundary with no hints', () => {
    const result = scoreSort(23, 20, 0); // 23/20 = 1.15 exactly
    expect(result.ratio).toBeCloseTo(1.15, 9);
    expect(result.stars).toBe(3);
  });

  it('drops to 2 stars at the same ratio when a hint was used', () => {
    const result = scoreSort(23, 20, 1); // ratio 1.15, but hints > 0
    expect(result.stars).toBe(2);
  });

  it('awards 2 stars right at the 1.6 ratio boundary', () => {
    const result = scoreSort(32, 20, 0); // 32/20 = 1.6 exactly
    expect(result.ratio).toBeCloseTo(1.6, 9);
    expect(result.stars).toBe(2);
  });

  it('drops to 1 star just beyond the 1.6 ratio boundary', () => {
    const result = scoreSort(33, 20, 0); // 33/20 = 1.65
    expect(result.stars).toBe(1);
  });

  it('keeps the score within [300, 1000] across a wide range of pours', () => {
    for (const pours of [1, 5, 20, 50, 200]) {
      const result = scoreSort(pours, 10, 0);
      expect(result.score).toBeGreaterThanOrEqual(300);
      expect(result.score).toBeLessThanOrEqual(1000);
    }
  });

  it('reduces score as more hints are used, all else equal', () => {
    const noHints = scoreSort(24, 20, 0);
    const oneHint = scoreSort(24, 20, 1);
    const twoHints = scoreSort(24, 20, 2);
    expect(oneHint.score).toBeLessThan(noHints.score);
    expect(twoHints.score).toBeLessThan(oneHint.score);
  });

  it('treats pours below par as a perfect ratio instead of dividing below 1', () => {
    const result = scoreSort(5, 20, 0);
    expect(result.ratio).toBeCloseTo(1, 9);
    expect(result.stars).toBe(3);
    expect(result.score).toBe(1000);
  });

  it('handles a non-positive par gracefully without dividing by zero', () => {
    const result = scoreSort(10, 0, 0);
    expect(Number.isFinite(result.ratio)).toBe(true);
    expect(result.ratio).toBeCloseTo(1, 9);
    expect(result.score).toBeGreaterThanOrEqual(300);
    expect(result.score).toBeLessThanOrEqual(1000);
  });
});
