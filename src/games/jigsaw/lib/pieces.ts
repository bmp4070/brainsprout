import { mulberry32, pick } from '../../../shared/lib/rng';

/**
 * A single interior edge's tab direction from the perspective of the piece
 * whose border it describes: `1` = this piece has a tab protruding outward
 * across the edge, `-1` = this piece has a matching socket (recessed inward),
 * `0` = flat (only used on the outer border of the whole puzzle).
 */
export type EdgeTab = -1 | 0 | 1;

export interface PieceEdges {
  top: EdgeTab;
  right: EdgeTab;
  bottom: EdgeTab;
  left: EdgeTab;
}

export interface PieceDef {
  row: number;
  col: number;
  edges: PieceEdges;
}

export interface PieceLayout {
  rows: number;
  cols: number;
  /** Indexed [row][col]. */
  pieces: PieceDef[][];
}

/**
 * Builds the classic-interlocking-tab layout for a `rows` x `cols` grid of
 * pieces. Deterministic given `seed`: every interior edge gets a randomly
 * chosen tab direction, and the two pieces sharing that edge always get
 * complementary values (one's tab is the other's matching socket).
 */
export function generatePieceLayout(rows: number, cols: number, seed: number): PieceLayout {
  if (rows <= 0 || cols <= 0) {
    throw new Error('generatePieceLayout: rows and cols must be > 0');
  }
  const rng = mulberry32(seed);

  // vSign[r][c] = tab sign for the vertical edge between piece (r,c) and (r,c+1).
  const vSign: EdgeTab[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: EdgeTab[] = [];
    for (let c = 0; c < cols - 1; c++) {
      row.push(pick(rng, [1, -1] as const));
    }
    vSign.push(row);
  }

  // hSign[r][c] = tab sign for the horizontal edge between piece (r,c) and (r+1,c).
  const hSign: EdgeTab[][] = [];
  for (let r = 0; r < rows - 1; r++) {
    const row: EdgeTab[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(pick(rng, [1, -1] as const));
    }
    hSign.push(row);
  }

  const pieces: PieceDef[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: PieceDef[] = [];
    for (let c = 0; c < cols; c++) {
      const top: EdgeTab = r === 0 ? 0 : ((-hSign[r - 1][c]) as EdgeTab);
      const bottom: EdgeTab = r === rows - 1 ? 0 : hSign[r][c];
      const left: EdgeTab = c === 0 ? 0 : ((-vSign[r][c - 1]) as EdgeTab);
      const right: EdgeTab = c === cols - 1 ? 0 : vSign[r][c];
      row.push({ row: r, col: c, edges: { top, right, bottom, left } });
    }
    pieces.push(row);
  }

  return { rows, cols, pieces };
}

interface Point {
  x: number;
  y: number;
}

/** Traces one edge of the piece outline from `start` to `end`, bulging along `normal` when `sign` is non-zero. */
function edgeSegment(start: Point, end: Point, normal: Point, sign: EdgeTab, tabSize: number): string {
  if (sign === 0) {
    return `L ${end.x},${end.y} `;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const ptAt = (u: number, v: number): Point => ({
    x: start.x + dx * u + normal.x * v * tabSize * sign,
    y: start.y + dy * u + normal.y * v * tabSize * sign,
  });

  const p1 = ptAt(0.3, 0);
  const p2 = ptAt(0.5, 1);
  const p3 = ptAt(0.7, 0);
  const p4 = ptAt(1, 0);
  const mid1a = ptAt(0.4, 0);
  const mid1b = ptAt(0.4, 1);
  const mid2a = ptAt(0.6, 1);
  const mid2b = ptAt(0.6, 0);

  let out = '';
  out += `C ${start.x},${start.y} ${p1.x},${p1.y} ${p1.x},${p1.y} `;
  out += `C ${mid1a.x},${mid1a.y} ${mid1b.x},${mid1b.y} ${p2.x},${p2.y} `;
  out += `C ${mid2a.x},${mid2a.y} ${mid2b.x},${mid2b.y} ${p3.x},${p3.y} `;
  out += `C ${p3.x},${p3.y} ${p4.x},${p4.y} ${p4.x},${p4.y} `;
  return out;
}

/**
 * The size (in local path units) of the piece's bounding box: the cell plus
 * a `tabSize` margin on every side (tabs/sockets never bulge further than that).
 */
export function pieceBoundingBox(
  cellW: number,
  cellH: number,
  tabSize: number,
): { width: number; height: number } {
  return { width: cellW + 2 * tabSize, height: cellH + 2 * tabSize };
}

/**
 * Builds an SVG path (in a local coordinate system sized by `pieceBoundingBox`)
 * for `piece`'s outline, including its tab/socket bumps. Border edges (tab
 * value 0) are drawn flat.
 */
export function buildPiecePath(
  piece: PieceDef,
  cellW: number,
  cellH: number,
  tabSize: number,
): string {
  const { top, right, bottom, left } = piece.edges;
  const x0 = tabSize;
  const y0 = tabSize;
  const x1 = tabSize + cellW;
  const y1 = tabSize + cellH;

  const topLeft: Point = { x: x0, y: y0 };
  const topRight: Point = { x: x1, y: y0 };
  const bottomRight: Point = { x: x1, y: y1 };
  const bottomLeft: Point = { x: x0, y: y1 };

  let d = `M ${topLeft.x},${topLeft.y} `;
  d += edgeSegment(topLeft, topRight, { x: 0, y: -1 }, top, tabSize);
  d += edgeSegment(topRight, bottomRight, { x: 1, y: 0 }, right, tabSize);
  d += edgeSegment(bottomRight, bottomLeft, { x: 0, y: 1 }, bottom, tabSize);
  d += edgeSegment(bottomLeft, topLeft, { x: -1, y: 0 }, left, tabSize);
  d += 'Z';
  return d;
}
