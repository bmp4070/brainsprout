import { describe, expect, it } from 'vitest';
import { scoreMaze } from './scoring';

describe('scoreMaze', () => {
  it('awards 3 stars and a perfect score for an optimal, hint-free run', () => {
    const result = scoreMaze(10, 10, 0);
    expect(result.stars).toBe(3);
    expect(result.score).toBe(1000); // 300 + 500 + 200
  });

  it('grants 3 stars up to 1.2x optimal with no hints', () => {
    expect(scoreMaze(12, 10, 0).stars).toBe(3); // exactly 1.2x
    expect(scoreMaze(13, 10, 0).stars).toBe(2); // just past 1.2x
  });

  it('never gives 3 stars when a hint was used', () => {
    const result = scoreMaze(10, 10, 1);
    expect(result.stars).toBe(2);
  });

  it('gives 2 stars up to 2x optimal', () => {
    expect(scoreMaze(20, 10, 0).stars).toBe(2); // exactly 2x
    expect(scoreMaze(21, 10, 0).stars).toBe(1); // beyond 2x
  });

  it('gives 1 star for a wandering run', () => {
    expect(scoreMaze(50, 10, 0).stars).toBe(1);
  });

  it('subtracts a penalty per hint and drops the no-hint bonus', () => {
    const noHint = scoreMaze(10, 10, 0);
    const oneHint = scoreMaze(10, 10, 1);
    // Loses the 200 no-hint bonus plus a 40 per-hint penalty.
    expect(oneHint.score).toBe(noHint.score - 200 - 40);
  });

  it('never returns a negative score', () => {
    const result = scoreMaze(1, 1000, 20);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('stays within a clean 0..1000 range', () => {
    for (const moves of [1, 10, 25, 100, 500]) {
      for (const optimal of [1, 10, 40]) {
        for (const hints of [0, 1, 5]) {
          const { score } = scoreMaze(moves, optimal, hints);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1000);
        }
      }
    }
  });

  it('guards a non-positive optimalLength as full efficiency', () => {
    const result = scoreMaze(5, 0, 0);
    expect(result.score).toBe(1000); // 300 + 500 + 200
  });
});
