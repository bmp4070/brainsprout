import { describe, expect, it } from 'vitest';
import { scoreRoute } from './scoring';

describe('scoreRoute stars', () => {
  it('gives 3 stars at optimal (ratio 1.0)', () => {
    expect(scoreRoute(100, 100).stars).toBe(3);
  });

  it('gives 3 stars exactly at the 1.03 edge', () => {
    expect(scoreRoute(103, 100).stars).toBe(3);
  });

  it('drops to 2 stars just past 1.03', () => {
    expect(scoreRoute(103.001, 100).stars).toBe(2);
  });

  it('gives 2 stars exactly at the 1.30 edge', () => {
    expect(scoreRoute(130, 100).stars).toBe(2);
  });

  it('drops to 1 star just past 1.30', () => {
    expect(scoreRoute(130.001, 100).stars).toBe(1);
  });

  it('gives 1 star for any (worse) completion', () => {
    expect(scoreRoute(500, 100).stars).toBe(1);
  });
});

describe('scoreRoute ratio and bounds', () => {
  it('reports ratio = player / optimal', () => {
    expect(scoreRoute(150, 100).ratio).toBeCloseTo(1.5, 9);
  });

  it('scores exactly 1000 at ratio 1.0', () => {
    expect(scoreRoute(100, 100).score).toBe(1000);
  });

  it('keeps score within [300, 1000] across a wide range', () => {
    for (let player = 100; player <= 10000; player += 137) {
      const { score } = scoreRoute(player, 100);
      expect(score).toBeGreaterThanOrEqual(300);
      expect(score).toBeLessThanOrEqual(1000);
    }
  });

  it('floors far-from-optimal routes at 300', () => {
    // efficiency well below 0.55 -> clamp to 0 -> score 300.
    expect(scoreRoute(1000, 100).score).toBe(300);
  });

  it('guards a non-positive optimal length (ratio 1, perfect score)', () => {
    const r = scoreRoute(50, 0);
    expect(r.ratio).toBe(1);
    expect(r.stars).toBe(3);
    expect(r.score).toBe(1000);
  });
});
