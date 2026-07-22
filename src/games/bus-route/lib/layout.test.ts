import { describe, expect, it } from 'vitest';
import { chebyshevSteps } from './grid';
import { generateLayout, REQUIRED_SEPARATION, SCHOOL, STOP_BOUNDS } from './layout';
import { DIFFICULTIES } from './types';
import type { DifficultyConfig } from './types';

const ALL: DifficultyConfig[] = [DIFFICULTIES.easy, DIFFICULTIES.medium, DIFFICULTIES.hard];

describe('generateLayout', () => {
  it('is deterministic per seed', () => {
    for (const diff of ALL) {
      const a = generateLayout(diff, 12345);
      const b = generateLayout(diff, 12345);
      expect(a).toEqual(b);
    }
  });

  it('differs across seeds', () => {
    const a = generateLayout(DIFFICULTIES.hard, 1);
    const b = generateLayout(DIFFICULTIES.hard, 2);
    expect(a.stops).not.toEqual(b.stops);
  });

  it('produces the right number of stops with stable ids and the fixed school', () => {
    for (const diff of ALL) {
      const layout = generateLayout(diff, 7);
      expect(layout.stops).toHaveLength(diff.stopCount);
      expect(layout.stops.map((s) => s.id)).toEqual(
        Array.from({ length: diff.stopCount }, (_, i) => i),
      );
      expect(layout.school).toEqual(SCHOOL);
      expect(layout.seed).toBe(7);
    }
  });

  it('places every stop on a grid intersection within bounds', () => {
    for (const diff of ALL) {
      for (let seed = 0; seed < 100; seed++) {
        const layout = generateLayout(diff, seed);
        for (const stop of layout.stops) {
          expect(stop.x).toBeGreaterThanOrEqual(STOP_BOUNDS.minX);
          expect(stop.x).toBeLessThanOrEqual(STOP_BOUNDS.maxX);
          expect(stop.y).toBeGreaterThanOrEqual(STOP_BOUNDS.minY);
          expect(stop.y).toBeLessThanOrEqual(STOP_BOUNDS.maxY);
          expect(stop.x % 10).toBe(0);
          expect(stop.y % 10).toBe(0);
        }
      }
    }
  });

  it('the school sits on an intersection, distinct from the stop band', () => {
    expect(SCHOOL.x % 10).toBe(0);
    expect(SCHOOL.y % 10).toBe(0);
    expect(SCHOOL.y).toBeGreaterThan(STOP_BOUNDS.maxY);
  });

  it('respects the required Chebyshev separation across 100 seeds x 3 difficulties', () => {
    for (const diff of ALL) {
      for (let seed = 0; seed < 100; seed++) {
        const layout = generateLayout(diff, seed);
        for (const stop of layout.stops) {
          expect(chebyshevSteps(stop, layout.school)).toBeGreaterThanOrEqual(
            REQUIRED_SEPARATION,
          );
        }
        for (let i = 0; i < layout.stops.length; i++) {
          for (let j = i + 1; j < layout.stops.length; j++) {
            expect(chebyshevSteps(layout.stops[i], layout.stops[j])).toBeGreaterThanOrEqual(
              REQUIRED_SEPARATION,
            );
          }
        }
      }
    }
  });

  it('never places two stops on the same intersection', () => {
    for (const diff of ALL) {
      for (let seed = 0; seed < 100; seed++) {
        const layout = generateLayout(diff, seed);
        const keys = layout.stops.map((s) => `${s.x},${s.y}`);
        expect(new Set(keys).size).toBe(keys.length);
      }
    }
  });

  it('never throws', () => {
    for (const diff of ALL) {
      for (let seed = 0; seed < 50; seed++) {
        expect(() => generateLayout(diff, seed)).not.toThrow();
      }
    }
  });
});
