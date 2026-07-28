import { describe, expect, it } from 'vitest';
import { scoreFit } from './scoring';
import { DIFFICULTIES } from './types';

const D = DIFFICULTIES.easy;

describe('scoreFit', () => {
  it('awards a perfect 1000 for a fast, clean solve', () => {
    // 4 pieces -> par 48s. Finish in 10s (under par) with no hints/misplaces.
    const result = scoreFit(10_000, 4, 0, 0, D);
    expect(result.score).toBe(1000); // 300 + 500 + 200
    expect(result.stars).toBe(3);
  });

  it('sits at the completion floor for a very slow solve with penalties', () => {
    // Huge time -> a tiny (non-zero) speed bonus; many hints/misplaces zero out
    // accuracy, so the score sits just above the 300 completion floor.
    const result = scoreFit(10_000_000, 4, 5, 20, D);
    expect(result.score).toBeGreaterThanOrEqual(300);
    expect(result.score).toBeLessThan(310);
    expect(result.stars).toBe(1);
  });

  it('scales the speed bonus against par (pieceCount x 12s)', () => {
    // par = 4 * 12 = 48s. Finish in 96s -> ratio 0.5 -> speed bonus 250.
    const result = scoreFit(96_000, 4, 0, 0, D);
    expect(result.score).toBe(300 + 250 + 200); // 750
    expect(result.stars).toBe(2);
  });

  it('subtracts 80 per hint from the accuracy bonus', () => {
    // Fast (full speed 500), one hint -> accuracy 200-80=120.
    const result = scoreFit(1_000, 4, 1, 0, D);
    expect(result.score).toBe(300 + 500 + 120); // 920
    // Any hint forbids 3 stars.
    expect(result.stars).toBe(2);
  });

  it('subtracts 15 per misplaced attempt, floored at 0', () => {
    const result = scoreFit(1_000, 4, 0, 20, D);
    // accuracy: 200 - 300 -> floored 0.
    expect(result.score).toBe(300 + 500 + 0); // 800
  });

  it('gives 3 stars only with no hints and score >= 850', () => {
    // Fast clean solve, 2 pieces: par 24s, finish 24s -> full speed, accuracy 200.
    const result = scoreFit(24_000, 2, 0, 0, D);
    expect(result.score).toBe(1000);
    expect(result.stars).toBe(3);
  });

  it('drops to 1 star below 550', () => {
    // par = 24s (2 pieces). Finish in 240s -> ratio 0.1 -> speed 50. No accuracy.
    const result = scoreFit(240_000, 2, 0, 20, D);
    expect(result.score).toBe(350);
    expect(result.stars).toBe(1);
  });

  it('treats instant completion as full speed', () => {
    const result = scoreFit(0, 4, 0, 0, D);
    expect(result.score).toBe(1000);
  });

  it('always stays within [300, 1000]', () => {
    for (const ms of [0, 1000, 50_000, 5_000_000]) {
      for (const hints of [0, 1, 3]) {
        for (const misplaced of [0, 5, 50]) {
          const { score } = scoreFit(ms, 5, hints, misplaced, DIFFICULTIES.hard);
          expect(score).toBeGreaterThanOrEqual(300);
          expect(score).toBeLessThanOrEqual(1000);
        }
      }
    }
  });
});
