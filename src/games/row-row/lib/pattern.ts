import { mulberry32 } from '../../../shared/lib/rng';
import { HARD_TRICK_MS, HARD_TRICK_PROBABILITY, LEAD_IN_MS } from './constants';
import type { DifficultyConfig } from './types';

export interface Segment {
  type: 'row' | 'rest';
  durationMs: number;
}

/** Returns a random integer in [min, max] (inclusive), rounded to whole ms. */
function randRangeInt(rng: () => number, min: number, max: number): number {
  return Math.round(min + rng() * (max - min));
}

/**
 * Deterministically generates the drum pattern for a crossing: a fixed
 * short lead-in "get ready" rest, followed by `segmentCount` segments that
 * strictly alternate row/rest (starting with row), each with a duration
 * randomly chosen (seeded) within the tier's range. On the hard tier, rest
 * segments occasionally get substituted with a short "trick" duration.
 *
 * The returned pattern loops: the reducer indexes into it via
 * `elapsedMs % patternLoopMs`, so this never needs to grow dynamically.
 */
export function generatePattern(difficulty: DifficultyConfig, seed: number): Segment[] {
  const rng = mulberry32(seed);
  const [min, max] = difficulty.segmentMsRange;
  const segments: Segment[] = [{ type: 'rest', durationMs: LEAD_IN_MS }];

  for (let i = 0; i < difficulty.segmentCount; i++) {
    const type: Segment['type'] = i % 2 === 0 ? 'row' : 'rest';
    let durationMs = randRangeInt(rng, min, max);
    if (difficulty.id === 'hard' && type === 'rest' && rng() < HARD_TRICK_PROBABILITY) {
      durationMs = HARD_TRICK_MS;
    }
    segments.push({ type, durationMs });
  }

  return segments;
}

/** Sum of every segment's duration; the modulo period the pattern loops on. */
export function patternLoopDuration(pattern: Segment[]): number {
  return pattern.reduce((sum, seg) => sum + seg.durationMs, 0);
}
