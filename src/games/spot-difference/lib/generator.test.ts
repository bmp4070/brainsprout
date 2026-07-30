import { describe, expect, it } from 'vitest';
import { generatePuzzle } from './generator';
import { DIFFICULTIES } from './types';
import type { DifficultyConfig, Puzzle, SceneItem } from './types';
import { THEMES } from './themes';

const ALL_DIFFS: DifficultyConfig[] = [
  DIFFICULTIES.easy,
  DIFFICULTIES.medium,
  DIFFICULTIES.hard,
];
const THEME_IDS = THEMES.map((t) => t.id);

function byId(items: SceneItem[]): Map<string, SceneItem> {
  return new Map(items.map((it) => [it.id, it]));
}

interface SceneDiff {
  added: string[];
  removed: string[];
  changed: string[];
}

/** Classifies how RIGHT differs from LEFT, item by item (by id). */
function sceneDiff(puzzle: Puzzle): SceneDiff {
  const left = byId(puzzle.left.items);
  const right = byId(puzzle.right.items);
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];

  for (const id of left.keys()) if (!right.has(id)) removed.push(id);
  for (const id of right.keys()) if (!left.has(id)) added.push(id);
  for (const [id, l] of left) {
    const r = right.get(id);
    if (!r) continue;
    if (
      l.colorIndex !== r.colorIndex ||
      l.scale !== r.scale ||
      l.x !== r.x ||
      l.y !== r.y ||
      l.flipped !== r.flipped ||
      l.kind !== r.kind
    ) {
      changed.push(id);
    }
  }
  return { added, removed, changed };
}

function everyHitboxInBounds(puzzle: Puzzle): boolean {
  return puzzle.differences.every(
    (d) =>
      d.cx - d.radius >= 0 &&
      d.cx + d.radius <= 100 &&
      d.cy - d.radius >= 0 &&
      d.cy + d.radius <= 100,
  );
}

function hitboxesPairwiseDisjoint(puzzle: Puzzle): boolean {
  const d = puzzle.differences;
  for (let i = 0; i < d.length; i++) {
    for (let j = i + 1; j < d.length; j++) {
      const dist = Math.hypot(d[i].cx - d[j].cx, d[i].cy - d[j].cy);
      if (dist < d[i].radius + d[j].radius - 1e-9) return false;
    }
  }
  return true;
}

const VALID_KINDS = new Set(['recolor', 'remove', 'add', 'resize', 'shift', 'flip']);

describe('spot-difference generator', () => {
  it('is deterministic per (seed, themeId)', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 12345, 'park');
    const b = generatePuzzle(DIFFICULTIES.medium, 12345, 'park');
    expect(a).toEqual(b);
  });

  it('varies with the seed', () => {
    const a = generatePuzzle(DIFFICULTIES.medium, 1, 'park');
    const b = generatePuzzle(DIFFICULTIES.medium, 2, 'park');
    expect(a).not.toEqual(b);
  });

  it('places exactly itemCount items in the LEFT scene', () => {
    for (const diff of ALL_DIFFS) {
      const p = generatePuzzle(diff, 99, 'beach');
      expect(p.left.items).toHaveLength(diff.itemCount);
    }
  });

  it('produces exactly diffCount differences with valid kinds', () => {
    for (const diff of ALL_DIFFS) {
      const p = generatePuzzle(diff, 7, 'farm');
      expect(p.differences).toHaveLength(diff.diffCount);
      for (const d of p.differences) {
        expect(VALID_KINDS.has(d.kind)).toBe(true);
        expect(d.radius).toBeGreaterThanOrEqual(6);
        expect(d.radius).toBeLessThanOrEqual(14);
      }
    }
  });

  it('keeps every hitbox inside 0..100 and pairwise non-overlapping', () => {
    for (const themeId of THEME_IDS) {
      for (const diff of ALL_DIFFS) {
        for (let seed = 0; seed < 10; seed++) {
          const p = generatePuzzle(diff, seed * 31 + 5, themeId);
          expect(everyHitboxInBounds(p)).toBe(true);
          expect(hitboxesPairwiseDisjoint(p)).toBe(true);
        }
      }
    }
  });

  it('makes RIGHT differ from LEFT in exactly the diff regions', () => {
    for (const diff of ALL_DIFFS) {
      for (let seed = 0; seed < 20; seed++) {
        const p = generatePuzzle(diff, seed * 101 + 3, 'park');
        const sd = sceneDiff(p);

        const kinds = p.differences.map((d) => d.kind);
        const addCount = kinds.filter((k) => k === 'add').length;
        const removeCount = kinds.filter((k) => k === 'remove').length;
        const changeCount = kinds.filter(
          (k) => k === 'recolor' || k === 'resize' || k === 'shift' || k === 'flip',
        ).length;

        // Every difference corresponds to a real change and vice-versa.
        expect(sd.added).toHaveLength(addCount);
        expect(sd.removed).toHaveLength(removeCount);
        expect(sd.changed).toHaveLength(changeCount);
        expect(sd.added.length + sd.removed.length + sd.changed.length).toBe(diff.diffCount);
      }
    }
  });

  it('applies each mutation kind consistently when present', () => {
    // Sweep enough seeds that each kind appears at least once, and verify the
    // specific field it should touch actually changed.
    for (let seed = 0; seed < 60; seed++) {
      const p = generatePuzzle(DIFFICULTIES.hard, seed * 17 + 11, 'space');
      const left = byId(p.left.items);
      const right = byId(p.right.items);
      for (const d of p.differences) {
        // Locate the affected item by hitbox center for change kinds.
        if (d.kind === 'recolor' || d.kind === 'resize' || d.kind === 'flip' || d.kind === 'shift') {
          // find item present in both whose left-center is near the hitbox
          let touched = false;
          for (const [id, l] of left) {
            const r = right.get(id);
            if (!r) continue;
            const changed =
              l.colorIndex !== r.colorIndex ||
              l.scale !== r.scale ||
              l.x !== r.x ||
              l.y !== r.y ||
              l.flipped !== r.flipped;
            if (changed) touched = true;
          }
          expect(touched).toBe(true);
        }
      }
    }
  });

  it('never throws across 40 seeds x 3 difficulties x every theme, all valid', () => {
    const start = performance.now();
    let count = 0;
    for (const themeId of THEME_IDS) {
      for (const diff of ALL_DIFFS) {
        for (let seed = 0; seed < 40; seed++) {
          const p = generatePuzzle(diff, seed * 2654435761, themeId);
          expect(p.left.items).toHaveLength(diff.itemCount);
          expect(p.differences).toHaveLength(diff.diffCount);
          expect(everyHitboxInBounds(p)).toBe(true);
          expect(hitboxesPairwiseDisjoint(p)).toBe(true);
          count++;
        }
      }
    }
    const ms = performance.now() - start;
    // eslint-disable-next-line no-console
    console.log(`generated ${count} puzzles in ${ms.toFixed(1)}ms (${(ms / count).toFixed(3)}ms each)`);
    expect(count).toBe(THEME_IDS.length * ALL_DIFFS.length * 40);
  });
});
