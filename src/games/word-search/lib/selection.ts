import type { CellPos, Direction, Placement } from './types';

const COMPASS: { angle: number; direction: Direction }[] = [
  { angle: 0, direction: { dr: 0, dc: 1 } }, // E
  { angle: 45, direction: { dr: 1, dc: 1 } }, // SE
  { angle: 90, direction: { dr: 1, dc: 0 } }, // S
  { angle: 135, direction: { dr: 1, dc: -1 } }, // SW
  { angle: 180, direction: { dr: 0, dc: -1 } }, // W
  { angle: 225, direction: { dr: -1, dc: -1 } }, // NW
  { angle: 270, direction: { dr: -1, dc: 0 } }, // N
  { angle: 315, direction: { dr: -1, dc: 1 } }, // NE
];

/** Unique string key for a cell position, usable as a Set/Map key. */
export function cellKey(pos: CellPos): string {
  return `${pos.row},${pos.col}`;
}

function normalizeAngle(deg: number): number {
  const mod = deg % 360;
  return mod < 0 ? mod + 360 : mod;
}

/**
 * Projects `current` onto the nearest of the 8 compass directions from `anchor`,
 * clamped to the grid bounds, returning the ordered inclusive cell path
 * (anchor first). Returns just [anchor] when anchor === current.
 */
export function snapLine(
  anchor: CellPos,
  current: CellPos,
  size: number,
): CellPos[] {
  const dr = current.row - anchor.row;
  const dc = current.col - anchor.col;

  if (dr === 0 && dc === 0) {
    return [anchor];
  }

  const angle = normalizeAngle((Math.atan2(dr, dc) * 180) / Math.PI);
  let nearest = COMPASS[0];
  let smallestDiff = Infinity;
  for (const entry of COMPASS) {
    const diff = Math.min(
      Math.abs(angle - entry.angle),
      360 - Math.abs(angle - entry.angle),
    );
    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearest = entry;
    }
  }

  const direction = nearest.direction;
  const distance = Math.max(Math.abs(dr), Math.abs(dc));

  let maxStepsRow = Infinity;
  if (direction.dr === 1) maxStepsRow = size - 1 - anchor.row;
  else if (direction.dr === -1) maxStepsRow = anchor.row;

  let maxStepsCol = Infinity;
  if (direction.dc === 1) maxStepsCol = size - 1 - anchor.col;
  else if (direction.dc === -1) maxStepsCol = anchor.col;

  const maxSteps = Math.max(
    0,
    Math.min(distance, maxStepsRow, maxStepsCol),
  );

  const cells: CellPos[] = [];
  for (let i = 0; i <= maxSteps; i++) {
    cells.push({
      row: anchor.row + direction.dr * i,
      col: anchor.col + direction.dc * i,
    });
  }
  return cells;
}

function endpointsEqual(a: CellPos, b: CellPos): boolean {
  return a.row === b.row && a.col === b.col;
}

/**
 * Finds the placement (if any) whose endpoints match the given selection's
 * endpoints, forward or reversed, excluding words already found.
 */
export function matchSelection(
  cells: CellPos[],
  placements: Placement[],
  foundWords: ReadonlySet<string>,
): Placement | null {
  if (cells.length === 0) return null;
  const start = cells[0];
  const end = cells[cells.length - 1];

  for (const placement of placements) {
    if (foundWords.has(placement.word)) continue;
    if (placement.cells.length !== cells.length) continue;

    const pStart = placement.cells[0];
    const pEnd = placement.cells[placement.cells.length - 1];

    const forwardMatch =
      endpointsEqual(start, pStart) && endpointsEqual(end, pEnd);
    const reverseMatch =
      endpointsEqual(start, pEnd) && endpointsEqual(end, pStart);

    if (forwardMatch || reverseMatch) {
      return placement;
    }
  }
  return null;
}
