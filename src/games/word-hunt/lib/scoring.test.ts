import { describe, expect, it } from 'vitest';
import { scoreHunt } from './scoring';

describe('scoreHunt', () => {
  it('gives 3 stars for a hint-free finish', () => {
    expect(scoreHunt(20000, 5, 0).stars).toBe(3);
  });

  it('drops below 3 stars once a hint is used', () => {
    expect(scoreHunt(20000, 5, 1).stars).toBeLessThan(3);
  });

  it('clamps into [300, 1000]', () => {
    expect(scoreHunt(1, 1, 0).score).toBeLessThanOrEqual(1000);
    // Many hints zero the accuracy bonus; a very slow solve leaves only a small
    // residual speed bonus, so the worst case sits just above the 300 base.
    const worst = scoreHunt(10 * 60 * 1000, 12, 20);
    expect(worst.score).toBeGreaterThanOrEqual(300);
    expect(worst.score).toBeLessThan(500);
    expect(worst.stars).toBe(1);
  });

  it('never divides by zero on a zero elapsed', () => {
    expect(() => scoreHunt(0, 5, 0)).not.toThrow();
  });

  it('rewards speed once past par for the same accuracy', () => {
    // par for 8 words = 8 * 12s = 96s; compare a fast solve against one well
    // beyond par so the speed bonus actually differs.
    expect(scoreHunt(2000, 8, 0).score).toBeGreaterThan(scoreHunt(300000, 8, 0).score);
  });
});
