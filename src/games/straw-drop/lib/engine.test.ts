import { describe, expect, it } from 'vitest';
import { advanceBottles, findHit, pruneBottles, shouldSpawn } from './engine';
import { DESPAWN_X, DROP_X } from './types';
import type { Bottle } from './types';

const bottle = (id: number, x: number, filled = false): Bottle => ({ id, x, colorIndex: 0, filled });

describe('advanceBottles', () => {
  it('moves every bottle left by speed * dt', () => {
    const out = advanceBottles([bottle(0, 50), bottle(1, 80)], 20, 0.5);
    expect(out[0].x).toBeCloseTo(40);
    expect(out[1].x).toBeCloseTo(70);
  });

  it('does not mutate the input', () => {
    const input = [bottle(0, 50)];
    advanceBottles(input, 20, 1);
    expect(input[0].x).toBe(50);
  });
});

describe('pruneBottles', () => {
  it('drops bottles past the left despawn line', () => {
    const out = pruneBottles([bottle(0, DESPAWN_X - 1), bottle(1, 10)]);
    expect(out.map((b) => b.id)).toEqual([1]);
  });
});

describe('findHit', () => {
  it('catches an unfilled bottle within the mouth tolerance', () => {
    expect(findHit([bottle(0, DROP_X + 2)], 4)).toBe(0);
  });

  it('misses when the nearest bottle is outside the tolerance', () => {
    expect(findHit([bottle(0, DROP_X + 6)], 4)).toBeNull();
  });

  it('ignores already-filled bottles', () => {
    expect(findHit([bottle(0, DROP_X, true)], 4)).toBeNull();
  });

  it('prefers the closest bottle to the drop point', () => {
    expect(findHit([bottle(0, DROP_X + 3), bottle(1, DROP_X - 1)], 5)).toBe(1);
  });

  it('is exclusive at exactly the tolerance boundary (inclusive)', () => {
    expect(findHit([bottle(0, DROP_X + 4)], 4)).toBe(0);
    expect(findHit([bottle(0, DROP_X + 4.01)], 4)).toBeNull();
  });
});

describe('shouldSpawn', () => {
  it('always spawns when the belt is empty', () => {
    expect(shouldSpawn([], 108, 20)).toBe(true);
  });

  it('spawns once the right-most bottle has moved a full gap in', () => {
    expect(shouldSpawn([bottle(0, 108 - 20)], 108, 20)).toBe(true);
    expect(shouldSpawn([bottle(0, 108 - 19)], 108, 20)).toBe(false);
  });
});
