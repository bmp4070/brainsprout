import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { solveRemaining } from './solver';
import { DIFFICULTIES, triKey } from './types';
import type { Backdrop, DifficultyId } from './types';

const DIFFS: DifficultyId[] = ['easy', 'medium', 'hard'];
const BACKDROPS: Backdrop[] = ['diamond', 'rhombus'];
const MIN_PIECES: Record<string, number> = { easy: 3, medium: 4, hard: 5 };

describe('generatePuzzle', () => {
  it('is deterministic per (seed, backdrop)', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 123, 'diamond');
    const b = generatePuzzle(DIFFICULTIES.medium, 123, 'diamond');
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const c = generatePuzzle(DIFFICULTIES.medium, 123, 'rhombus');
    expect(JSON.stringify(c)).not.toBe(JSON.stringify(a));
  });

  for (const id of DIFFS) {
    for (const backdrop of BACKDROPS) {
      it(`${id}/${backdrop}: valid, solvable puzzles across seeds`, () => {
        for (let seed = 1; seed <= 20; seed += 1) {
          const p = generatePuzzle(DIFFICULTIES[id], seed, backdrop);
          const regionKeys = new Set(p.region.map(triKey));
          // Region is well-formed: no duplicate tris, a multiple of 4 (whole cells).
          expect(regionKeys.size).toBe(p.region.length);
          expect(p.region.length % 4).toBe(0);
          expect(p.backdrop).toBe(backdrop);

          // Piece count within bounds.
          expect(p.pieces.length).toBeGreaterThanOrEqual(MIN_PIECES[id]);
          expect(p.pieces.length).toBeLessThanOrEqual(DIFFICULTIES[id].maxPieces);

          // Each piece id used exactly once; solution covers the region exactly.
          const ids = p.solution.map((s) => s.pieceId).sort((x, y) => x - y);
          expect(ids).toEqual(p.pieces.map((pc) => pc.id).sort((x, y) => x - y));
          const solCover = new Set<string>();
          for (const pl of p.solution) for (const t of pl.tris) solCover.add(triKey(t));
          expect(solCover.size).toBe(p.region.length);
          for (const key of regionKeys) expect(solCover.has(key)).toBe(true);

          // Independent solve from scratch confirms solvability.
          const res = solveRemaining(regionKeys, new Set(), p.pieces, 2_000_000);
          expect(res.solution).not.toBeNull();
        }
      });
    }
  }

  it('does not throw for any difficulty/backdrop across many seeds', () => {
    for (const id of DIFFS) {
      for (const backdrop of BACKDROPS) {
        for (let seed = 1; seed <= 15; seed += 1) {
          expect(() => generatePuzzle(DIFFICULTIES[id], seed, backdrop)).not.toThrow();
        }
      }
    }
  });
});
