export type DifficultyId = 'easy' | 'medium' | 'hard';

export interface DifficultyConfig {
  id: DifficultyId;
  label: string;
  emoji: string;
  /** Min/max duration (ms) for each generated row/rest segment. */
  segmentMsRange: [number, number];
  /** Number of alternating row/rest segments generated after the lead-in. */
  segmentCount: number;
  /** Distance units (at SPEED_PER_MS) a perfect crossing must cover. */
  totalDistance: number;
}

/**
 * Tuning arithmetic (see lib/constants.ts for SPEED_PER_MS = 1):
 *
 * Easy: range [1100,1700]ms (mid 1400), 10 segments -> 5 row segments.
 *   Row-time sum (avg) = 5 * 1400 = 7000ms -> totalDistance = 7000.
 *   A perfect player reaches totalDistance right at the end of the 5th row
 *   segment (index 8 of 0..9), i.e. after lead-in + 9 segments =
 *   800 + 9*1400 = 13400ms (~13.4s), inside the 12-15s target.
 *
 * Medium: range [700,1100]ms (mid 900), 12 segments -> 6 row segments.
 *   Row-time sum (avg) = 6 * 900 = 5400ms per loop. totalDistance = 7200
 *   (slightly longer than easy's 7000), which needs ~1.33 loops: after loop
 *   1 (800 + 12*900 = 11600ms, 5400 row-ms banked), loop 2 needs another
 *   1800 row-ms, reached after lead-in(800)+row(900)+rest(900)+row(900) =
 *   3500ms more. Total ~15100ms (~15.1s) -- a bit longer than easy, as
 *   intended, while still "about one and a third" loops.
 *
 * Hard: range [400,750]ms (mid 575), 14 segments -> 7 row segments, with
 *   occasional 250ms "trick" rest segments (see HARD_TRICK_*). Row-time sum
 *   (avg) = 7 * 575 = 4025ms per loop. totalDistance = 8000 (longest),
 *   needing ~2 loops: loop 1 banks 4025, loop 2 needs another 3975, which
 *   takes essentially all 7 row segments of loop 2 (7*575=4025 >= 3975),
 *   i.e. lead-in + 13 segments = 800 + 13*575 = 8275ms more. Total
 *   ~8850 + 8275 = ~17100ms (~17.1s) -- the longest, hardest crossing.
 *   (Trick rest segments occasionally shorten the real loop duration and
 *   demand faster release reflexes, without changing the row-time math.)
 */
export const DIFFICULTIES: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    id: 'easy',
    label: 'Easy',
    emoji: '🐣',
    segmentMsRange: [1100, 1700],
    segmentCount: 10,
    totalDistance: 7000,
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    emoji: '🐉',
    segmentMsRange: [700, 1100],
    segmentCount: 12,
    totalDistance: 7200,
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    emoji: '🔥',
    segmentMsRange: [400, 750],
    segmentCount: 14,
    totalDistance: 8000,
  },
};
