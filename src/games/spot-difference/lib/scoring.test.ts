import { describe, expect, it } from 'vitest';
import { scoreSpot } from './scoring';

describe('scoreSpot', () => {
  it('caps a fast, clean solve at 1000 with 3 stars', () => {
    const r = scoreSpot(1000, 4, 0, 0);
    expect(r.score).toBe(1000);
    expect(r.stars).toBe(3);
  });

  it('floors at 300 for a very slow, hint-heavy solve with 1 star', () => {
    const r = scoreSpot(1_000_000_000, 4, 0, 5);
    expect(r.score).toBe(300);
    expect(r.stars).toBe(1);
  });

  it('awards 3 stars for no hints and at most one wrong tap', () => {
    expect(scoreSpot(1000, 4, 1, 0).stars).toBe(3);
    expect(scoreSpot(1000, 4, 0, 0).stars).toBe(3);
  });

  it('denies the third star once a second wrong tap or any hint appears', () => {
    expect(scoreSpot(1000, 4, 2, 0).stars).toBe(2); // fast so score high -> 2
    expect(scoreSpot(1000, 4, 0, 1).stars).toBe(2);
  });

  it('gives 2 stars at the score>=550 boundary and 1 star just below', () => {
    // par = 4*8s = 32000ms. elapsed = 2*par -> speed = 250; 5 hints -> accuracy 0.
    const atBoundary = scoreSpot(64_000, 4, 0, 5);
    expect(atBoundary.score).toBe(550);
    expect(atBoundary.stars).toBe(2);

    const justBelow = scoreSpot(70_000, 4, 0, 5);
    expect(justBelow.score).toBeLessThan(550);
    expect(justBelow.stars).toBe(1);
  });

  it('reduces the accuracy component by ~40/hint and ~20/wrong tap', () => {
    // Full speed bonus (elapsed <= par) so only accuracy varies.
    const clean = scoreSpot(1000, 4, 0, 0).score; // 300 + 500 + 200 = 1000
    const oneHint = scoreSpot(1000, 4, 0, 1).score; // -40
    const oneWrong = scoreSpot(1000, 4, 1, 0).score; // -20
    expect(clean).toBe(1000);
    expect(oneHint).toBe(960);
    expect(oneWrong).toBe(980);
  });

  it('floors the accuracy component at 0 (never negative)', () => {
    // Many hints+wrong taps: accuracy clamps to 0, speed still full -> 800.
    const r = scoreSpot(1000, 4, 10, 10);
    expect(r.score).toBe(800);
  });

  it('always returns a score within [300, 1000]', () => {
    for (const elapsed of [1, 1000, 32_000, 500_000, 5_000_000]) {
      for (const diffCount of [4, 6, 8]) {
        for (const wrong of [0, 3, 20]) {
          for (const hints of [0, 2, 20]) {
            const r = scoreSpot(elapsed, diffCount, wrong, hints);
            expect(r.score).toBeGreaterThanOrEqual(300);
            expect(r.score).toBeLessThanOrEqual(1000);
            expect([1, 2, 3]).toContain(r.stars);
          }
        }
      }
    }
  });
});
