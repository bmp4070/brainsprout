import { describe, expect, it } from 'vitest';
import { scoreRound } from './scoring';

describe('scoreRound', () => {
  it('awards 3 stars at 9 or 10 correct', () => {
    expect(scoreRound(9, 0).stars).toBe(3);
    expect(scoreRound(10, 0).stars).toBe(3);
  });

  it('awards 2 stars from 6 to 8 correct', () => {
    expect(scoreRound(6, 0).stars).toBe(2);
    expect(scoreRound(7, 0).stars).toBe(2);
    expect(scoreRound(8, 0).stars).toBe(2);
  });

  it('awards 1 star below 6 correct, even with 0 correct', () => {
    expect(scoreRound(5, 0).stars).toBe(1);
    expect(scoreRound(0, 0).stars).toBe(1);
  });

  it('score is always within [0, 1000]', () => {
    for (let correct = 0; correct <= 10; correct += 1) {
      for (let streak = 0; streak <= 10; streak += 1) {
        const { score } = scoreRound(correct, streak);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1000);
      }
    }
  });

  it('a perfect round with a full streak scores 1000', () => {
    expect(scoreRound(10, 10).score).toBe(1000);
  });

  it('zero correct and zero streak scores 0', () => {
    expect(scoreRound(0, 0).score).toBe(0);
  });

  it('a higher streak with the same accuracy never scores lower', () => {
    const lowStreak = scoreRound(8, 2).score;
    const highStreak = scoreRound(8, 8).score;
    expect(highStreak).toBeGreaterThan(lowStreak);
  });

  it('is monotonic in correct count for a fixed streak', () => {
    const scores = Array.from({ length: 11 }, (_, correct) => scoreRound(correct, 0).score);
    for (let i = 1; i < scores.length; i += 1) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });
});
