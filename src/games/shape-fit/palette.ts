/**
 * The seven block colors used across difficulties. Kept as a plain JS array
 * (rather than only CSS custom properties) because a couple of call sites
 * need the actual hex values -- e.g. confetti colors in CelebrationOverlay --
 * while shape-fit.module.css-adjacent components define matching inline
 * background colors for the on-screen blocks. Keep the two in sync by hand
 * if either changes.
 *
 * Hues are spread around the wheel and lightness is deliberately varied
 * (not just hue) so adjacent colors stay distinguishable for common color
 * vision deficiencies, not just for typical color vision.
 */
export const COLOR_NAMES = [
  'Cherry Red',
  'Tangerine Orange',
  'Golden Yellow',
  'Meadow Green',
  'Sky Blue',
  'Berry Purple',
  'Bubblegum Pink',
] as const;

export const BLOCK_HEX = [
  '#e6483f',
  '#ff9330',
  '#f5c518',
  '#3fae5e',
  '#3ba3e0',
  '#8452d5',
  '#e457a8',
] as const;

/** Human-readable color name for a color index, with a safe fallback. */
export function blockColorName(index: number): string {
  return COLOR_NAMES[index] ?? `color ${index}`;
}

/** Hex color for a piece's colorIndex, with a safe fallback. */
export function blockColorHex(index: number): string {
  return BLOCK_HEX[index] ?? '#999999';
}
