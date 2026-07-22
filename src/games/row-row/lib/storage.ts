import type { DifficultyId } from './types';

export interface BestRecord {
  bestScore: number;
  plays: number;
}

function storageKey(sceneId: string, difficultyId: DifficultyId): string {
  return `riddler:row-row:best:${sceneId}:${difficultyId}`;
}

function isBestRecord(value: unknown): value is BestRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.bestScore === 'number' &&
    Number.isFinite(record.bestScore) &&
    typeof record.plays === 'number' &&
    Number.isFinite(record.plays)
  );
}

/** Reads the best-score record for a scene/difficulty pair, or null if absent/corrupt. */
export function getBest(sceneId: string, difficultyId: DifficultyId): BestRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(sceneId, difficultyId));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBestRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Records a completed crossing's score, updating the best score only if
 * `score` is higher. Always increments the play count. Safe no-op (with
 * best-effort return value) if localStorage is unavailable or corrupt.
 */
export function recordResult(
  sceneId: string,
  difficultyId: DifficultyId,
  score: number,
): { best: BestRecord; isNewBest: boolean } {
  const existing = getBest(sceneId, difficultyId);
  const plays = (existing?.plays ?? 0) + 1;
  const isNewBest = existing === null || score > existing.bestScore;
  const bestScore = isNewBest ? score : existing.bestScore;
  const best: BestRecord = { bestScore, plays };

  try {
    localStorage.setItem(storageKey(sceneId, difficultyId), JSON.stringify(best));
  } catch {
    // Ignore write failures (e.g. storage disabled/full); still return computed value.
  }

  return { best, isNewBest };
}
