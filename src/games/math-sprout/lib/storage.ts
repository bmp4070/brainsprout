import type { DifficultyId, OperationId } from './types';

export interface BestRecord {
  bestScore: number;
  plays: number;
}

function storageKey(operation: OperationId, difficultyId: DifficultyId): string {
  return `riddler:math-sprout:best:${operation}:${difficultyId}`;
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

/** Reads the best-score record for an operation/difficulty pair, or null if absent/corrupt. */
export function getBest(operation: OperationId, difficultyId: DifficultyId): BestRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(operation, difficultyId));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return isBestRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Records a completed round's score, updating the best only if `score` is
 * HIGHER (best = max). Always increments the play count. Safe no-op (with
 * best-effort return value) if localStorage is unavailable or corrupt.
 */
export function recordResult(
  operation: OperationId,
  difficultyId: DifficultyId,
  score: number,
): { best: BestRecord; isNewBest: boolean } {
  const existing = getBest(operation, difficultyId);
  const plays = (existing?.plays ?? 0) + 1;
  const isNewBest = existing === null || score > existing.bestScore;
  const bestScore = isNewBest ? score : existing.bestScore;
  const best: BestRecord = { bestScore, plays };

  try {
    localStorage.setItem(storageKey(operation, difficultyId), JSON.stringify(best));
  } catch {
    // Ignore write failures (e.g. storage disabled/full); still return computed value.
  }

  return { best, isNewBest };
}
