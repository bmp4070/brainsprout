import type { DifficultyId } from './types';

export interface BestRecord {
  bestMs: number;
  plays: number;
}

function storageKey(themeId: string, difficultyId: DifficultyId): string {
  return `riddler:word-search:best:${themeId}:${difficultyId}`;
}

function isBestRecord(value: unknown): value is BestRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.bestMs === 'number' &&
    Number.isFinite(record.bestMs) &&
    typeof record.plays === 'number' &&
    Number.isFinite(record.plays)
  );
}

/** Reads the best-time record for a theme/difficulty pair, or null if absent/corrupt. */
export function getBest(
  themeId: string,
  difficultyId: DifficultyId,
): BestRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(themeId, difficultyId));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBestRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Records a completed play's time, updating the best time only if `ms` is lower.
 * Always increments the play count. Safe no-op (with best-effort return value)
 * if localStorage is unavailable or corrupt.
 */
export function recordResult(
  themeId: string,
  difficultyId: DifficultyId,
  ms: number,
): { best: BestRecord; isNewBest: boolean } {
  const existing = getBest(themeId, difficultyId);
  const plays = (existing?.plays ?? 0) + 1;
  const isNewBest = existing === null || ms < existing.bestMs;
  const bestMs = isNewBest ? ms : existing.bestMs;
  const best: BestRecord = { bestMs, plays };

  try {
    localStorage.setItem(
      storageKey(themeId, difficultyId),
      JSON.stringify(best),
    );
  } catch {
    // Ignore write failures (e.g. storage disabled/full); still return computed value.
  }

  return { best, isNewBest };
}
