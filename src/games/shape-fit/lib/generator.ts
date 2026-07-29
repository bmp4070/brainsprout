import { mulberry32 } from '../../../shared/lib/rng';
import { PALETTE } from './palette';
import type { PaletteShape } from './palette';
import { normalizeTris, orientations, placeAt } from './tri';
import type { Backdrop, DifficultyConfig, Piece, Placement, Puzzle, Tri } from './types';
import { triKey } from './types';

/** Minimum piece count per difficulty (rejects trivial puzzles). */
const MIN_PIECES: Record<string, number> = { easy: 3, medium: 4, hard: 5 };

interface CellPos {
  r: number;
  c: number;
}

/** The backdrop's cells (normalized so min row/col are 0). */
function backdropCells(backdrop: Backdrop, size: number): CellPos[] {
  const cells: CellPos[] = [];
  if (backdrop === 'diamond') {
    // Manhattan ball, radius capped at 2 (13 cells) so no round has a huge,
    // unwieldy tray; the rhombus carries the size progression at hard.
    const radius = Math.min(size, 2);
    for (let r = 0; r <= 2 * radius; r += 1) {
      for (let c = 0; c <= 2 * radius; c += 1) {
        if (Math.abs(r - radius) + Math.abs(c - radius) <= radius) cells.push({ r, c });
      }
    }
  } else {
    // Sheared parallelogram: rows H, width W, slanting right with each row.
    const h = size + 1;
    const w = size + 2;
    for (let i = 0; i < h; i += 1) {
      for (let j = 0; j < w; j += 1) {
        cells.push({ r: i, c: i + j });
      }
    }
  }
  let minR = Infinity;
  let minC = Infinity;
  for (const cell of cells) {
    if (cell.r < minR) minR = cell.r;
    if (cell.c < minC) minC = cell.c;
  }
  return cells.map((cell) => ({ r: cell.r - minR, c: cell.c - minC }));
}

/** All four atomic tris of every backdrop cell. */
function regionTris(cells: CellPos[]): Tri[] {
  const tris: Tri[] = [];
  for (const cell of cells) {
    for (let d = 0 as Tri['d']; d < 4; d = (d + 1) as Tri['d']) {
      tris.push({ r: cell.r, c: cell.c, d });
    }
  }
  return tris;
}

interface PlacedShape {
  shape: PaletteShape;
  tris: Tri[]; // absolute
}

interface ShapeOrientations {
  shape: PaletteShape;
  orientations: Tri[][];
}

interface Candidate {
  shape: PaletteShape;
  abs: Tri[];
}

/**
 * Greedy randomized tiler: repeatedly covers the lowest uncovered tri with a
 * fitting palette placement, weighted toward LARGER and non-square pieces so
 * puzzles look varied (triangles + lines + squares) rather than a grid of unit
 * squares. Because a single-triangle piece fits any lone tri, greedy placement
 * can never get stuck — it always terminates with a valid exact tiling, so the
 * result is a guaranteed-solvable round. Deterministic given `rng`.
 */
function greedyTile(
  region: Tri[],
  regionSet: ReadonlySet<string>,
  palette: ShapeOrientations[],
  rng: () => number,
): PlacedShape[] {
  const covered = new Set<string>();
  const placed: PlacedShape[] = [];

  function fittingCandidates(target: Tri): Candidate[] {
    const out: Candidate[] = [];
    for (const so of palette) {
      for (const orient of so.orientations) {
        for (const anchor of orient) {
          if (anchor.d !== target.d) continue;
          const abs = placeAt(orient, target.r - anchor.r, target.c - anchor.c);
          let fits = true;
          for (const t of abs) {
            const key = triKey(t);
            if (!regionSet.has(key) || covered.has(key)) {
              fits = false;
              break;
            }
          }
          if (fits) out.push({ shape: so.shape, abs });
        }
      }
    }
    return out;
  }

  for (const target of region) {
    if (covered.has(triKey(target))) continue;
    const candidates = fittingCandidates(target);
    // Weight larger pieces higher (fewer, chunkier tiles), with a bump for
    // triangles/lines so the tangram look shows through. TRI_SMALL is always
    // present as a fallback, so `candidates` is never empty.
    let total = 0;
    const weights = candidates.map((cand) => {
      const size = cand.abs.length;
      // Square the size so big pieces are preferred (small tray) but small
      // triangles still get chosen often enough to give the tangram look; the
      // triangle bump keeps them appearing.
      const kindBonus = cand.shape.kind === 'triangle' ? 1.6 : cand.shape.kind === 'line' ? 1.2 : 1;
      const w = size * size * kindBonus;
      total += w;
      return w;
    });
    let pick = rng() * total;
    let chosen = candidates[candidates.length - 1];
    for (let i = 0; i < candidates.length; i += 1) {
      pick -= weights[i];
      if (pick <= 0) {
        chosen = candidates[i];
        break;
      }
    }
    for (const t of chosen.abs) covered.add(triKey(t));
    placed.push({ shape: chosen.shape, tris: chosen.abs });
  }

  return placed;
}

function kindsOf(placed: PlacedShape[]): Set<string> {
  return new Set(placed.map((p) => p.shape.kind));
}

/**
 * A tiling reads as a proper tangram when it includes at least one triangle
 * (the whole point of the game) plus at least one other shape family.
 */
function isVaried(placed: PlacedShape[]): boolean {
  return placed.some((p) => p.shape.kind === 'triangle') && kindsOf(placed).size >= 2;
}

function toPuzzle(
  placed: PlacedShape[],
  cells: CellPos[],
  region: Tri[],
  backdrop: Backdrop,
  _size: number,
  seed: number,
): Puzzle {
  const rows = Math.max(...cells.map((c) => c.r)) + 1;
  const cols = Math.max(...cells.map((c) => c.c)) + 1;
  const pieces: Piece[] = placed.map((p, id) => ({
    id,
    tris: normalizeTris(p.shape.tris),
    colorIndex: id % 7,
    kind: p.shape.kind,
  }));
  const solution: Placement[] = placed.map((p, id) => ({ pieceId: id, tris: p.tris }));
  return { rows, cols, backdrop, region, pieces, solution, seed };
}

/**
 * Generates a solvable tangram round: a diamond or rhombus backdrop tiled by
 * triangle/square/line pieces. Deterministic per (seed, backdrop). Never
 * throws and never loops forever — bounded attempts then a fresh seed.
 */
export function generatePuzzle(
  difficulty: DifficultyConfig,
  seed: number,
  backdrop: Backdrop,
): Puzzle {
  const size = difficulty.size;
  const minPieces = MIN_PIECES[difficulty.id] ?? 3;
  const cells = backdropCells(backdrop, size);
  const region = regionTris(cells);
  const regionSet = new Set(region.map(triKey));
  const paletteOriented: ShapeOrientations[] = PALETTE.map((shape) => ({
    shape,
    orientations: orientations(shape.tris),
  }));

  const rng = mulberry32(seed);
  // Greedy tiling always succeeds; run several attempts and keep the one with
  // the FEWEST pieces that still looks varied and meets the minimum — a small,
  // chunky, kid-friendly tray. Falls back to the fewest-piece attempt overall.
  let best: PlacedShape[] | null = null;
  let bestOverall: PlacedShape[] | null = null;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const placed = greedyTile(region, regionSet, paletteOriented, rng);
    if (bestOverall === null || placed.length < bestOverall.length) bestOverall = placed;
    if (placed.length < minPieces || !isVaried(placed)) continue;
    if (best === null || placed.length < best.length) best = placed;
  }
  const chosen = best ?? bestOverall ?? greedyTile(region, regionSet, paletteOriented, rng);
  return toPuzzle(chosen, cells, region, backdrop, size, seed);
}
