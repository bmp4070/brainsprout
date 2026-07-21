import { describe, expect, it } from 'vitest';
import { shufflePositions } from './shuffle';

describe('shufflePositions', () => {
  it('returns the requested number of positions', () => {
    expect(shufflePositions(8, 1)).toHaveLength(8);
    expect(shufflePositions(0, 1)).toHaveLength(0);
  });

  it('is deterministic for a given seed', () => {
    const a = shufflePositions(16, 42);
    const b = shufflePositions(16, 42);
    expect(a).toEqual(b);
  });

  it('produces different layouts for different seeds', () => {
    const a = shufflePositions(16, 1);
    const b = shufflePositions(16, 2);
    expect(a).not.toEqual(b);
  });

  it('keeps fractions within [0, 1) and rotation within [-12, 12]', () => {
    const positions = shufflePositions(32, 7);
    for (const p of positions) {
      expect(p.xFrac).toBeGreaterThanOrEqual(0);
      expect(p.xFrac).toBeLessThan(1);
      expect(p.yFrac).toBeGreaterThanOrEqual(0);
      expect(p.yFrac).toBeLessThan(1);
      expect(p.rotation).toBeGreaterThanOrEqual(-12);
      expect(p.rotation).toBeLessThanOrEqual(12);
    }
  });
});
