import { describe, expect, it } from 'vitest';
import { calculateScore } from './scoring';
import { DIFFICULTIES } from './types';

describe('word-wheel scoring', () => {
  it('awards 3 stars and max score for fast completion with no hints', () => {
    const res = calculateScore(5000, 8, 0, 0, DIFFICULTIES.easy);
    expect(res.stars).toBe(3);
    expect(res.score).toBeGreaterThanOrEqual(850);
  });

  it('penalizes score when hints and invalid attempts are used', () => {
    const clean = calculateScore(30000, 8, 0, 0, DIFFICULTIES.easy);
    const withPenalties = calculateScore(30000, 8, 2, 3, DIFFICULTIES.easy);
    expect(withPenalties.score).toBeLessThan(clean.score);
  });

  it('clamps minimum score to floor (300)', () => {
    const res = calculateScore(Number.POSITIVE_INFINITY, 5, 10, 20, DIFFICULTIES.easy);
    expect(res.score).toBe(300);
    expect(res.stars).toBe(1);
  });
});
