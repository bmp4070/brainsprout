import { mulberry32 } from '../../../shared/lib/rng';
import type { FracRect } from './trayLayout';

export interface ShufflePosition {
  /** Fraction of the board's width (may exceed 1 in side-tray mode). */
  xFrac: number;
  /** Fraction of the board's height (may exceed 1 in below-tray mode). */
  yFrac: number;
  /** Cosmetic rotation in degrees, roughly in [-12, 12]. */
  rotation: number;
}

const MAX_ROTATION_DEG = 12;

/**
 * Deterministically scatters `count` pieces across `rect` (the tray's
 * region, in board-fraction space), each at a slight random rotation. Pure
 * function of `(count, seed, rect)`. Positions overlap freely by design —
 * like a real puzzle-box pile — since `rect` is much smaller than the sum
 * of the pieces' bounding boxes.
 */
export function shufflePositions(count: number, seed: number, rect: FracRect): ShufflePosition[] {
  const rng = mulberry32(seed);
  const width = rect.x1 - rect.x0;
  const height = rect.y1 - rect.y0;
  const positions: ShufflePosition[] = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      xFrac: rect.x0 + rng() * width,
      yFrac: rect.y0 + rng() * height,
      rotation: (rng() * 2 - 1) * MAX_ROTATION_DEG,
    });
  }
  return positions;
}
