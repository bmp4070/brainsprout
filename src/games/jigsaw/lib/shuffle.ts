import { mulberry32 } from '../../../shared/lib/rng';

export interface ShufflePosition {
  /** Fraction (0..1) across the tray area's width. */
  xFrac: number;
  /** Fraction (0..1) down the tray area's height. */
  yFrac: number;
  /** Cosmetic rotation in degrees, roughly in [-12, 12]. */
  rotation: number;
}

const MAX_ROTATION_DEG = 12;

/**
 * Deterministically scatters `count` pieces across a normalized tray area,
 * each at a slight random rotation. Pure function of `(count, seed)`.
 */
export function shufflePositions(count: number, seed: number): ShufflePosition[] {
  const rng = mulberry32(seed);
  const positions: ShufflePosition[] = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      xFrac: rng(),
      yFrac: rng(),
      rotation: (rng() * 2 - 1) * MAX_ROTATION_DEG,
    });
  }
  return positions;
}
