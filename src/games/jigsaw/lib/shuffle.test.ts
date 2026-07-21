import { describe, expect, it } from 'vitest';
import { shufflePositions } from './shuffle';
import { getTrayRect } from './trayLayout';
import type { FracRect } from './trayLayout';

const belowRect = getTrayRect('below');
const sideRect = getTrayRect('side');

describe('shufflePositions', () => {
  it('returns the requested number of positions', () => {
    expect(shufflePositions(8, 1, belowRect)).toHaveLength(8);
    expect(shufflePositions(0, 1, belowRect)).toHaveLength(0);
  });

  it('is deterministic for a given seed', () => {
    const a = shufflePositions(16, 42, belowRect);
    const b = shufflePositions(16, 42, belowRect);
    expect(a).toEqual(b);
  });

  it('produces different layouts for different seeds', () => {
    const a = shufflePositions(16, 1, belowRect);
    const b = shufflePositions(16, 2, belowRect);
    expect(a).not.toEqual(b);
  });

  function expectWithinRect(rect: FracRect) {
    const positions = shufflePositions(32, 7, rect);
    for (const p of positions) {
      expect(p.xFrac).toBeGreaterThanOrEqual(rect.x0);
      expect(p.xFrac).toBeLessThan(rect.x1);
      expect(p.yFrac).toBeGreaterThanOrEqual(rect.y0);
      expect(p.yFrac).toBeLessThan(rect.y1);
      expect(p.rotation).toBeGreaterThanOrEqual(-12);
      expect(p.rotation).toBeLessThanOrEqual(12);
    }
  }

  it('keeps positions within the below tray rect and rotation within [-12, 12]', () => {
    expectWithinRect(belowRect);
  });

  it('keeps positions within the side tray rect (which extends past x=1)', () => {
    expectWithinRect(sideRect);
  });
});
