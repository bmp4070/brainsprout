import { describe, expect, it } from 'vitest';
import { scoreMemory } from './scoring';

describe('scoreMemory', () => {
  it('gives 3 stars and a high score for a fast, clean run', () => {
    const result = scoreMemory(1000, 6, 0);
    expect(result.stars).toBe(3);
    expect(result.score).toBeGreaterThanOrEqual(900);
  });

  it('still gives 3 stars with a single wrong tap', () => {
    expect(scoreMemory(5000, 6, 1).stars).toBe(3);
  });

  it('drops below 3 stars with two or more wrong taps', () => {
    expect(scoreMemory(5000, 6, 2).stars).toBeLessThan(3);
  });

  it('clamps the score into [300, 1000]', () => {
    // Fastest possible run tops out at 1000, not above.
    expect(scoreMemory(1, 1, 0).score).toBeLessThanOrEqual(1000);
    // A slow run with lots of wrong taps zeroes both bonuses and bottoms out
    // near the 300 base (speed bonus only reaches 0 asymptotically).
    const worst = scoreMemory(10 * 60 * 1000, 18, 50);
    expect(worst.score).toBeGreaterThanOrEqual(300);
    expect(worst.score).toBeLessThan(360);
    expect(worst.stars).toBe(1);
  });

  it('never divides by zero on a zero elapsed', () => {
    expect(() => scoreMemory(0, 6, 0)).not.toThrow();
    expect(scoreMemory(0, 6, 0).score).toBeLessThanOrEqual(1000);
  });

  it('rewards speed: faster beats slower for the same accuracy', () => {
    const fast = scoreMemory(2000, 12, 0).score;
    const slow = scoreMemory(60000, 12, 0).score;
    expect(fast).toBeGreaterThan(slow);
  });
});
