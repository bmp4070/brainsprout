/**
 * The seven potion colors used across difficulties. Kept as a plain JS array
 * (rather than only CSS custom properties) because a couple of call sites
 * need the actual hex values -- e.g. confetti colors in CelebrationOverlay --
 * while PotionBottle.module.css defines matching `.color0`..`.color6`
 * gradient classes for the on-screen liquid. Keep the two in sync by hand
 * if either changes.
 *
 * Hues are spread around the wheel and lightness is deliberately varied
 * (not just hue) so adjacent colors stay distinguishable for common color
 * vision deficiencies, not just for typical color vision.
 */
export const COLOR_NAMES = [
  'Ruby Red',
  'Tangerine',
  'Sunshine Yellow',
  'Emerald Green',
  'Aqua Blue',
  'Sapphire Blue',
  'Violet',
] as const;

export const POTION_HEX = [
  '#e63950',
  '#ff8c1a',
  '#ffd633',
  '#2fa866',
  '#26b8cc',
  '#3e5fd9',
  '#9c4fd1',
] as const;

/** Human-readable color name for a color index, with a safe fallback. */
export function colorName(index: number): string {
  return COLOR_NAMES[index] ?? `color ${index}`;
}
