import { describe, expect, it } from 'vitest';
import { cellKey, matchSelection, snapLine } from './selection';
import type { Placement } from './types';

describe('snapLine', () => {
  const size = 8;

  it('returns just the anchor when anchor === current', () => {
    const anchor = { row: 3, col: 3 };
    expect(snapLine(anchor, { row: 3, col: 3 }, size)).toEqual([anchor]);
  });

  it('snaps an exact horizontal drag', () => {
    const cells = snapLine({ row: 2, col: 1 }, { row: 2, col: 4 }, size);
    expect(cells).toEqual([
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 2, col: 4 },
    ]);
  });

  it('snaps an exact vertical drag', () => {
    const cells = snapLine({ row: 0, col: 0 }, { row: 3, col: 0 }, size);
    expect(cells).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 3, col: 0 },
    ]);
  });

  it('snaps an exact diagonal drag', () => {
    const cells = snapLine({ row: 0, col: 0 }, { row: 3, col: 3 }, size);
    expect(cells).toEqual([
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
    ]);
  });

  it('snaps a sloppy near-horizontal drag to the horizontal', () => {
    // Mostly-east drag with a slight vertical wobble should snap to due east.
    const cells = snapLine({ row: 2, col: 1 }, { row: 3, col: 5 }, size);
    expect(cells[0]).toEqual({ row: 2, col: 1 });
    for (const cell of cells) {
      expect(cell.row).toBe(2);
    }
  });

  it('snaps a sloppy near-diagonal drag to the diagonal', () => {
    const cells = snapLine({ row: 0, col: 0 }, { row: 4, col: 3 }, size);
    // angle of (dr=4, dc=3) ~ 53.13 deg, nearer to 45 (diagonal) than 90 (south).
    // Chebyshev distance of the drag (4) is preserved along the snapped direction.
    expect(cells[cells.length - 1]).toEqual({ row: 4, col: 4 });
  });

  it('clamps at the grid edge', () => {
    const cells = snapLine({ row: 6, col: 6 }, { row: 12, col: 12 }, size);
    // size 8 -> max valid row/col index is 7
    expect(cells[cells.length - 1]).toEqual({ row: 7, col: 7 });
    for (const cell of cells) {
      expect(cell.row).toBeLessThan(size);
      expect(cell.col).toBeLessThan(size);
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.col).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles a single cell selection at the corner', () => {
    const anchor = { row: 0, col: 0 };
    expect(snapLine(anchor, anchor, size)).toEqual([anchor]);
  });
});

describe('cellKey', () => {
  it('formats as "row,col"', () => {
    expect(cellKey({ row: 2, col: 5 })).toBe('2,5');
  });
});

describe('matchSelection', () => {
  const placements: Placement[] = [
    {
      word: 'CAT',
      cells: [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ],
    },
    {
      word: 'DOG',
      cells: [
        { row: 1, col: 0 },
        { row: 2, col: 0 },
        { row: 3, col: 0 },
      ],
    },
  ];

  it('matches a forward selection', () => {
    const cells = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    const match = matchSelection(cells, placements, new Set());
    expect(match?.word).toBe('CAT');
  });

  it('matches a reversed selection', () => {
    const cells = [
      { row: 3, col: 0 },
      { row: 2, col: 0 },
      { row: 1, col: 0 },
    ];
    const match = matchSelection(cells, placements, new Set());
    expect(match?.word).toBe('DOG');
  });

  it('rejects a selection matching neither word', () => {
    const cells = [
      { row: 5, col: 5 },
      { row: 5, col: 6 },
      { row: 5, col: 7 },
    ];
    expect(matchSelection(cells, placements, new Set())).toBeNull();
  });

  it('rejects a partial-length selection even if endpoints coincide with start', () => {
    const cells = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    expect(matchSelection(cells, placements, new Set())).toBeNull();
  });

  it('skips words already found', () => {
    const cells = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ];
    expect(matchSelection(cells, placements, new Set(['CAT']))).toBeNull();
  });
});
