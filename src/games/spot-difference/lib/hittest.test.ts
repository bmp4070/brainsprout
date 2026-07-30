import { describe, expect, it } from 'vitest';
import { differenceAt } from './hittest';
import type { Difference } from './types';

const diffs: Difference[] = [
  { id: 'a', kind: 'recolor', cx: 20, cy: 20, radius: 8 },
  { id: 'b', kind: 'remove', cx: 60, cy: 60, radius: 6 },
];

describe('differenceAt', () => {
  it('returns the difference when the tap is inside its radius', () => {
    expect(differenceAt(diffs, new Set(), 20, 20)?.id).toBe('a');
    expect(differenceAt(diffs, new Set(), 25, 20)?.id).toBe('a'); // 5 units from center < 8
    expect(differenceAt(diffs, new Set(), 60, 63)?.id).toBe('b'); // 3 units < 6
  });

  it('returns null when the tap is outside every radius', () => {
    expect(differenceAt(diffs, new Set(), 40, 40)).toBeNull();
    expect(differenceAt(diffs, new Set(), 20, 29)).toBeNull(); // 9 units > 8
  });

  it('treats the radius boundary as a hit (<=)', () => {
    // exactly 8 units away from center of 'a'
    expect(differenceAt(diffs, new Set(), 28, 20)?.id).toBe('a');
  });

  it('skips a difference already found', () => {
    expect(differenceAt(diffs, new Set(['a']), 20, 20)).toBeNull();
    expect(differenceAt(diffs, new Set(['a']), 60, 60)?.id).toBe('b');
  });

  it('returns the first containing difference on overlapping radii (containment order)', () => {
    const overlapping: Difference[] = [
      { id: 'x', kind: 'flip', cx: 50, cy: 50, radius: 10 },
      { id: 'y', kind: 'shift', cx: 55, cy: 50, radius: 10 },
    ];
    // point 52,50 is inside both; first in list order wins
    expect(differenceAt(overlapping, new Set(), 52, 50)?.id).toBe('x');
    // point contained only by y
    expect(differenceAt(overlapping, new Set(), 63, 50)?.id).toBe('y');
  });
});
