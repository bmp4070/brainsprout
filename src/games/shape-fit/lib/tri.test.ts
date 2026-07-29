import { describe, expect, it } from 'vitest';
import {
  canPlace,
  flipH,
  normalizeTris,
  orientations,
  placeAt,
  rotate90,
  triPolygon,
  trisKey,
} from './tri';
import { triKey } from './types';
import type { Tri } from './types';

// N,E,S,W quarters of cell (0,0).
const N: Tri = { r: 0, c: 0, d: 0 };
const E: Tri = { r: 0, c: 0, d: 1 };
const S: Tri = { r: 0, c: 0, d: 2 };
const W: Tri = { r: 0, c: 0, d: 3 };

const TRI_SMALL = [N];
const TRI_HALF = [N, E]; // upper-right half of the cell (hypotenuse TL->BR)
const SQ_UNIT = [N, E, S, W];
const LINE2 = [
  ...[N, E, S, W],
  ...[N, E, S, W].map((t) => ({ ...t, c: 1 })),
];

function setOf(tris: Tri[]): Set<string> {
  return new Set(tris.map(triKey));
}

describe('normalizeTris', () => {
  it('translates to origin and sorts', () => {
    const shifted: Tri[] = [
      { r: 3, c: 5, d: 2 },
      { r: 2, c: 5, d: 0 },
    ];
    expect(normalizeTris(shifted)).toEqual([
      { r: 0, c: 0, d: 0 },
      { r: 1, c: 0, d: 2 },
    ]);
  });
});

describe('rotate90 (90° clockwise)', () => {
  it('turns the upper-right half-triangle into the lower-right half', () => {
    // TRI_HALF = N+E (upper-right). Rotated 90° CW -> E+S (lower-right).
    expect(rotate90(TRI_HALF)).toEqual(normalizeTris([E, S]));
  });

  it('four rotations return the original (for an asymmetric piece)', () => {
    let tris = normalizeTris(TRI_HALF);
    for (let i = 0; i < 4; i += 1) tris = rotate90(tris);
    expect(tris).toEqual(normalizeTris(TRI_HALF));
  });
});

describe('flipH (mirror across a vertical axis)', () => {
  it('turns the upper-right half-triangle into the upper-left half', () => {
    // N+E mirrored -> N+W (E<->W), which is the upper-left half.
    expect(flipH(TRI_HALF)).toEqual(normalizeTris([N, W]));
  });

  it('is an involution', () => {
    expect(flipH(flipH(TRI_HALF))).toEqual(normalizeTris(TRI_HALF));
  });
});

describe('triPolygon (render geometry ground truth)', () => {
  it('gives the documented corners for each direction of cell (0,0)', () => {
    expect(triPolygon(N)).toEqual([
      [0, 0],
      [1, 0],
      [0.5, 0.5],
    ]);
    expect(triPolygon(E)).toEqual([
      [1, 0],
      [1, 1],
      [0.5, 0.5],
    ]);
    expect(triPolygon(S)).toEqual([
      [1, 1],
      [0, 1],
      [0.5, 0.5],
    ]);
    expect(triPolygon(W)).toEqual([
      [0, 1],
      [0, 0],
      [0.5, 0.5],
    ]);
  });

  it('rotate90 matches an actual 90° CW rotation of the geometry', () => {
    // Rotate every original polygon vertex by R(x,y) = (-y, x) (90° CW in
    // screen coords), then confirm the rotated piece's vertices are the same
    // point set up to a whole-cell translation (which normalize applies).
    const original = TRI_HALF;
    const rotated = rotate90(original);
    const rotatePt = ([x, y]: [number, number]): [number, number] => [-y, x];
    const originalPts = original.flatMap(triPolygon).map(rotatePt);
    const rotatedPts = rotated.flatMap(triPolygon);
    // Both sets differ only by an integer translation; align by min corner.
    const align = (pts: [number, number][]): string => {
      const minX = Math.min(...pts.map((p) => p[0]));
      const minY = Math.min(...pts.map((p) => p[1]));
      return [...new Set(pts.map(([x, y]) => `${x - minX},${y - minY}`))].sort().join('|');
    };
    expect(align(rotatedPts)).toBe(align(originalPts));
  });
});

describe('orientations', () => {
  it('unit square has 1 orientation', () => {
    expect(orientations(SQ_UNIT)).toHaveLength(1);
  });
  it('small triangle has 4 orientations', () => {
    expect(orientations(TRI_SMALL)).toHaveLength(4);
  });
  it('half triangle has 4 orientations', () => {
    expect(orientations(TRI_HALF)).toHaveLength(4);
  });
  it('2-line has 2 orientations', () => {
    expect(orientations(LINE2)).toHaveLength(2);
  });
  it('all orientations are normalized', () => {
    for (const o of orientations(TRI_HALF)) {
      expect(o).toEqual(normalizeTris(o));
    }
  });
});

describe('placeAt / canPlace', () => {
  const region = setOf([...SQ_UNIT, ...SQ_UNIT.map((t) => ({ ...t, c: 1 }))]); // cells (0,0),(0,1)

  it('placeAt translates cells, keeping directions', () => {
    expect(placeAt([N], 2, 3)).toEqual([{ r: 2, c: 3, d: 0 }]);
  });

  it('accepts a fit and rejects out-of-region / overlap', () => {
    const half = placeAt(TRI_HALF, 0, 0);
    expect(canPlace(region, new Set(), half)).toBe(true);
    expect(canPlace(region, new Set(), placeAt(SQ_UNIT, 0, 2))).toBe(false); // outside region
    const occupied = setOf(placeAt(SQ_UNIT, 0, 0));
    expect(canPlace(region, occupied, placeAt(TRI_HALF, 0, 0))).toBe(false); // overlap
  });
});

describe('trisKey', () => {
  it('is order- and translation-invariant', () => {
    expect(trisKey([E, N])).toBe(trisKey([{ r: 4, c: 4, d: 0 }, { r: 4, c: 4, d: 1 }]));
  });
});
