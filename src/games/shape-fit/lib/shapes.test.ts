import { describe, expect, it } from 'vitest';
import {
  canPlace,
  cellsKey,
  flipH,
  normalize,
  orientations,
  placeAt,
  rotate90,
} from './shapes';
import type { Cell } from './types';

const DOMINO: Cell[] = [{ r: 0, c: 0 }, { r: 0, c: 1 }];
const SQUARE: Cell[] = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }];
const L_TROMINO: Cell[] = [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }];
const L_TETROMINO: Cell[] = [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 2, c: 1 }];
const T_TETROMINO: Cell[] = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 1 }];
const S_TETROMINO: Cell[] = [{ r: 0, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 0 }, { r: 1, c: 1 }];
const I_TETROMINO: Cell[] = [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 2 }, { r: 0, c: 3 }];

describe('normalize', () => {
  it('translates to origin and sorts by (r, c)', () => {
    const shifted: Cell[] = [{ r: 3, c: 5 }, { r: 2, c: 5 }, { r: 2, c: 6 }];
    expect(normalize(shifted)).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 0 },
    ]);
  });

  it('handles an empty shape', () => {
    expect(normalize([])).toEqual([]);
  });
});

describe('rotate90', () => {
  it('rotates the L-tromino 90° clockwise and normalizes', () => {
    // L: (0,0),(1,0),(1,1) -> (r:c, c:-r): (0,0),(0,-1),(1,-1) -> normalize
    expect(rotate90(L_TROMINO)).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 1, c: 0 },
    ]);
  });

  it('four rotations return the original', () => {
    let cells = normalize(L_TETROMINO);
    for (let i = 0; i < 4; i += 1) cells = rotate90(cells);
    expect(cells).toEqual(normalize(L_TETROMINO));
  });
});

describe('flipH', () => {
  it('mirrors across the vertical axis and normalizes', () => {
    expect(flipH(L_TROMINO)).toEqual([
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
    ]);
  });

  it('is an involution', () => {
    expect(flipH(flipH(T_TETROMINO))).toEqual(normalize(T_TETROMINO));
  });
});

describe('cellsKey', () => {
  it('is invariant to input order and translation', () => {
    const a = cellsKey([{ r: 1, c: 1 }, { r: 0, c: 0 }, { r: 0, c: 1 }]);
    const b = cellsKey([{ r: 5, c: 5 }, { r: 4, c: 5 }, { r: 4, c: 4 }]);
    expect(a).toBe(b);
  });
});

describe('orientations', () => {
  it('square has 1 unique orientation', () => {
    expect(orientations(SQUARE)).toHaveLength(1);
  });

  it('domino has 2 unique orientations', () => {
    expect(orientations(DOMINO)).toHaveLength(2);
  });

  it('L-tromino has 4 unique orientations', () => {
    expect(orientations(L_TROMINO)).toHaveLength(4);
  });

  it('L-tetromino has 8 unique orientations (chiral)', () => {
    expect(orientations(L_TETROMINO)).toHaveLength(8);
  });

  it('T-tetromino has 4 unique orientations', () => {
    expect(orientations(T_TETROMINO)).toHaveLength(4);
  });

  it('S-tetromino has 4 unique orientations (2 rotations of S + 2 of its Z mirror)', () => {
    // With flips enabled, the S piece can also become its Z mirror, so a
    // flip-enabled orientation set has 4 members (not the rotation-only 2).
    expect(orientations(S_TETROMINO)).toHaveLength(4);
  });

  it('I-tetromino has 2 unique orientations', () => {
    expect(orientations(I_TETROMINO)).toHaveLength(2);
  });

  it('all orientations are normalized', () => {
    for (const o of orientations(L_TETROMINO)) {
      expect(o).toEqual(normalize(o));
    }
  });
});

describe('placeAt', () => {
  it('translates a normalized shape to an absolute anchor', () => {
    expect(placeAt(normalize(DOMINO), 2, 3)).toEqual([
      { r: 2, c: 3 },
      { r: 2, c: 4 },
    ]);
  });
});

describe('canPlace', () => {
  const region: boolean[][] = [
    [true, true, false],
    [true, true, false],
    [false, false, false],
  ];

  it('allows a fit inside the region on empty cells', () => {
    expect(canPlace(region, new Set(), [{ r: 0, c: 0 }, { r: 0, c: 1 }])).toBe(true);
  });

  it('rejects cells outside the region', () => {
    expect(canPlace(region, new Set(), [{ r: 0, c: 1 }, { r: 0, c: 2 }])).toBe(false);
  });

  it('rejects cells out of bounds', () => {
    expect(canPlace(region, new Set(), [{ r: 0, c: 0 }, { r: -1, c: 0 }])).toBe(false);
  });

  it('rejects overlapping an occupied cell', () => {
    expect(canPlace(region, new Set(['0,0']), [{ r: 0, c: 0 }, { r: 1, c: 0 }])).toBe(false);
  });
});
