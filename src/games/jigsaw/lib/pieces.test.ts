import { describe, expect, it } from 'vitest';
import { buildPiecePath, generatePieceLayout, pieceBoundingBox } from './pieces';

function allNumbersFinite(path: string): boolean {
  const numberTokens = path.match(/-?\d+(\.\d+)?/g) ?? [];
  return numberTokens.every((tok) => Number.isFinite(Number.parseFloat(tok)));
}

function commandTokens(path: string): string[] {
  return path.split(/\s+/).filter((tok) => tok === 'M' || tok === 'L' || tok === 'C' || tok === 'Z');
}

describe('generatePieceLayout', () => {
  const seeds = [1, 2, 42, 999, 123456];

  it('produces the requested grid dimensions', () => {
    const layout = generatePieceLayout(4, 8, 7);
    expect(layout.rows).toBe(4);
    expect(layout.cols).toBe(8);
    expect(layout.pieces.length).toBe(4);
    for (const row of layout.pieces) {
      expect(row.length).toBe(8);
    }
  });

  it('assigns flat (0) edges only on the outer border', () => {
    for (const seed of seeds) {
      const layout = generatePieceLayout(4, 4, seed);
      for (let r = 0; r < layout.rows; r++) {
        for (let c = 0; c < layout.cols; c++) {
          const { top, right, bottom, left } = layout.pieces[r][c].edges;
          if (r === 0) expect(top).toBe(0);
          else expect(top).not.toBe(0);
          if (r === layout.rows - 1) expect(bottom).toBe(0);
          else expect(bottom).not.toBe(0);
          if (c === 0) expect(left).toBe(0);
          else expect(left).not.toBe(0);
          if (c === layout.cols - 1) expect(right).toBe(0);
          else expect(right).not.toBe(0);
        }
      }
    }
  });

  it('gives every interior edge complementary tab values between neighbors', () => {
    for (const seed of seeds) {
      const layout = generatePieceLayout(4, 6, seed);
      // Horizontal neighbors: (r,c).right === -(r,c+1).left
      for (let r = 0; r < layout.rows; r++) {
        for (let c = 0; c < layout.cols - 1; c++) {
          const a = layout.pieces[r][c];
          const b = layout.pieces[r][c + 1];
          expect(a.edges.right).toBe(-b.edges.left);
        }
      }
      // Vertical neighbors: (r,c).bottom === -(r+1,c).top
      for (let r = 0; r < layout.rows - 1; r++) {
        for (let c = 0; c < layout.cols; c++) {
          const a = layout.pieces[r][c];
          const b = layout.pieces[r + 1][c];
          expect(a.edges.bottom).toBe(-b.edges.top);
        }
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = generatePieceLayout(4, 4, 55);
    const b = generatePieceLayout(4, 4, 55);
    expect(a).toEqual(b);
  });

  it('throws for invalid dimensions', () => {
    expect(() => generatePieceLayout(0, 4, 1)).toThrow();
    expect(() => generatePieceLayout(4, 0, 1)).toThrow();
  });
});

describe('pieceBoundingBox', () => {
  it('adds a tabSize margin on every side', () => {
    expect(pieceBoundingBox(100, 80, 20)).toEqual({ width: 140, height: 120 });
    expect(pieceBoundingBox(50, 50, 0)).toEqual({ width: 50, height: 50 });
  });
});

describe('buildPiecePath', () => {
  const layout = generatePieceLayout(4, 4, 12345);
  const cellW = 100;
  const cellH = 90;
  const tabSize = 20;

  it('starts with an M command and closes with Z', () => {
    for (const row of layout.pieces) {
      for (const piece of row) {
        const path = buildPiecePath(piece, cellW, cellH, tabSize);
        expect(path.startsWith('M ')).toBe(true);
        expect(path.trim().endsWith('Z')).toBe(true);
      }
    }
  });

  it('contains no NaN or infinite coordinates', () => {
    for (const row of layout.pieces) {
      for (const piece of row) {
        const path = buildPiecePath(piece, cellW, cellH, tabSize);
        expect(allNumbersFinite(path)).toBe(true);
      }
    }
  });

  it('has exactly one segment token per flat edge and four per tabbed edge', () => {
    for (const row of layout.pieces) {
      for (const piece of row) {
        const path = buildPiecePath(piece, cellW, cellH, tabSize);
        const tokens = commandTokens(path);
        expect(tokens[0]).toBe('M');
        expect(tokens.at(-1)).toBe('Z');

        const edgeValues = [piece.edges.top, piece.edges.right, piece.edges.bottom, piece.edges.left];
        const expectedSegmentTokens = edgeValues.reduce<number>(
          (sum, v) => sum + (v === 0 ? 1 : 4),
          0,
        );
        const bodyTokens = tokens.slice(1, -1);
        expect(bodyTokens.length).toBe(expectedSegmentTokens);
        expect(bodyTokens.filter((t) => t === 'C').length).toBe(
          edgeValues.filter((v) => v !== 0).length * 4,
        );
        expect(bodyTokens.filter((t) => t === 'L').length).toBe(
          edgeValues.filter((v) => v === 0).length,
        );
      }
    }
  });

  it('corner points land exactly on the cell rectangle for flat (border) pieces', () => {
    const corner = layout.pieces[0][0]; // top-left piece: top and left are flat
    const path = buildPiecePath(corner, cellW, cellH, tabSize);
    expect(path).toContain(`M ${tabSize},${tabSize} `);
  });
});
