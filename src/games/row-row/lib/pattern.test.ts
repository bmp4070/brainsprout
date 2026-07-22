import { describe, expect, it } from 'vitest';
import { generatePattern, patternLoopDuration } from './pattern';
import { DIFFICULTIES } from './types';
import { LEAD_IN_MS } from './constants';

describe('generatePattern', () => {
  it('is deterministic for the same difficulty and seed', () => {
    const a = generatePattern(DIFFICULTIES.medium, 42);
    const b = generatePattern(DIFFICULTIES.medium, 42);
    expect(a).toEqual(b);
  });

  it('differs (with overwhelming probability) for different seeds', () => {
    const a = generatePattern(DIFFICULTIES.medium, 1);
    const b = generatePattern(DIFFICULTIES.medium, 2);
    expect(a).not.toEqual(b);
  });

  for (const difficulty of Object.values(DIFFICULTIES)) {
    describe(`${difficulty.id} tier`, () => {
      it('starts with a fixed lead-in rest segment', () => {
        const pattern = generatePattern(difficulty, 7);
        expect(pattern[0]).toEqual({ type: 'rest', durationMs: LEAD_IN_MS });
      });

      it('has segmentCount alternating segments after the lead-in', () => {
        const pattern = generatePattern(difficulty, 7);
        expect(pattern).toHaveLength(difficulty.segmentCount + 1);
        for (let i = 1; i < pattern.length; i++) {
          const expectedType = (i - 1) % 2 === 0 ? 'row' : 'rest';
          expect(pattern[i].type).toBe(expectedType);
        }
      });

      it('keeps every non-lead-in, non-trick duration within the tier range', () => {
        const [min, max] = difficulty.segmentMsRange;
        for (let seed = 0; seed < 20; seed++) {
          const pattern = generatePattern(difficulty, seed);
          for (const segment of pattern.slice(1)) {
            const isHardTrick = difficulty.id === 'hard' && segment.durationMs === 250;
            if (isHardTrick) continue;
            expect(segment.durationMs).toBeGreaterThanOrEqual(min);
            expect(segment.durationMs).toBeLessThanOrEqual(max);
          }
        }
      });

      it('loop duration equals the sum of every segment duration', () => {
        const pattern = generatePattern(difficulty, 99);
        const expectedSum = pattern.reduce((sum, seg) => sum + seg.durationMs, 0);
        expect(patternLoopDuration(pattern)).toBe(expectedSum);
        expect(patternLoopDuration(pattern)).toBeGreaterThan(0);
      });
    });
  }

  it('only substitutes trick durations on the hard tier', () => {
    for (const difficulty of [DIFFICULTIES.easy, DIFFICULTIES.medium]) {
      for (let seed = 0; seed < 30; seed++) {
        const pattern = generatePattern(difficulty, seed);
        for (const segment of pattern) {
          if (segment.durationMs === 250) {
            // 250 could theoretically fall in medium's [700,1100] range? No,
            // it can't (250 < 700), so any 250 here would be a bug.
            expect(segment.durationMs).toBeGreaterThanOrEqual(difficulty.segmentMsRange[0]);
          }
        }
      }
    }
  });
});
