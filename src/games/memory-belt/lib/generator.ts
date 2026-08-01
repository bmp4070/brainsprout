import { mulberry32 } from '../../../shared/lib/rng';
import { ITEM_IDS } from './items';
import type { BeltItem, DifficultyConfig, Round } from './types';

/** Fisher–Yates shuffle onto a fresh array; deterministic given `rng`. */
function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Builds one seeded round:
 *  - `studied`: `studyCount` distinct catalogue items shown all at once.
 *  - `targetIds`: a random `targetCount` subset of `studied` — the ones that
 *    reappear on the belt and must be caught.
 *  - `belt`: the targets plus `distractorCount` never-studied decoys, shuffled.
 *
 * Counts are clamped to what the catalogue can supply so it never throws even
 * if a difficulty is mis-configured (studied ≤ catalogue, distractors ≤ what's
 * left after studied, targets ≤ studied). Deterministic given `seed`.
 */
export function generateRound(difficulty: DifficultyConfig, seed: number): Round {
  const rng = mulberry32(seed >>> 0);

  const pool = shuffle(rng, ITEM_IDS);
  const studyCount = Math.min(difficulty.studyCount, pool.length);
  const studied = pool.slice(0, studyCount);
  const rest = pool.slice(studyCount);

  const targetCount = Math.min(difficulty.targetCount, studied.length);
  const targetIds = shuffle(rng, studied).slice(0, targetCount);

  const distractorCount = Math.min(difficulty.distractorCount, rest.length);
  const distractorIds = shuffle(rng, rest).slice(0, distractorCount);

  const beltSeed: Array<{ itemId: string; isTarget: boolean }> = [
    ...targetIds.map((itemId) => ({ itemId, isTarget: true })),
    ...distractorIds.map((itemId) => ({ itemId, isTarget: false })),
  ];
  const belt: BeltItem[] = shuffle(rng, beltSeed).map((entry, index) => ({
    key: `${entry.itemId}-${index}`,
    itemId: entry.itemId,
    isTarget: entry.isTarget,
  }));

  return { difficulty, seed, studied, targetIds, belt };
}
