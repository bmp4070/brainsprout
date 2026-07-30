import type { ItemKind } from '../lib/items';

/** Dark ink reserved for tiny details (eyes, whiskers) that need max contrast. */
export const INK = '#2c2340';

/** Resolves a SceneItem's colorIndex against a theme's palette (defensive on bounds). */
export function paletteColor(palette: string[], colorIndex: number): string {
  if (palette.length === 0) return INK;
  const i = ((colorIndex % palette.length) + palette.length) % palette.length;
  return palette[i];
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Darken (factor < 1) or lighten (> 1) a hex color, for shading/outlines. */
export function shade(hex: string, factor: number): string {
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = clamp(parseInt(n.slice(0, 2), 16) * factor);
  const g = clamp(parseInt(n.slice(2, 4), 16) * factor);
  const b = clamp(parseInt(n.slice(4, 6), 16) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Kind-appropriate colour ramps. Every entry looks right for that item, but
// entries are distinct enough that a "recolor" difference is still spottable.
// colorIndex selects within the ramp so natural things stay natural (trees
// green, suns warm, rocks stony) instead of taking a random rainbow hue.
const GREENS = ['#5fbf5f', '#4e9c4e', '#7ac24a', '#3f9b6b', '#6bbf3f', '#8ac24a', '#e0913f'];
const WARM = ['#ffd23d', '#ffc61a', '#ffb703', '#ffa62b', '#ff9642', '#ffcf33', '#ffdd55'];
const WHITES = ['#ffffff', '#f2f7ff', '#eaf1fb', '#e6eef8', '#fdf5ff', '#f6efff', '#edf6f1'];
const STONE = ['#9aa0a6', '#868c93', '#b0a48f', '#7d726a', '#a89a86', '#8f8a84', '#b7aa98'];
const CAPS = ['#e14b4b', '#d64545', '#c65b3f', '#e07a3f', '#b56a8f', '#cf5a6a', '#a0543f'];
const WALLS = ['#f4e4c1', '#f6d7b0', '#e9c9a0', '#cfe0c3', '#c9d9ef', '#e7d3ef', '#f3cdd8'];
const SHELL = ['#c9a578', '#b98e5a', '#a87f4f', '#d0b184', '#bfa06a', '#a98a5c', '#c7a06a'];

function ramp(ramps: string[], colorIndex: number): string {
  const i = ((colorIndex % ramps.length) + ramps.length) % ramps.length;
  return ramps[i];
}

/**
 * The main fill for an item: natural kinds get a sensible per-kind ramp;
 * decorative kinds (flowers, balloons, kites, butterflies, stars, birds) take
 * the theme's bright palette so they stay colorful and varied.
 */
export function kindColor(kind: ItemKind, palette: string[], colorIndex: number): string {
  switch (kind) {
    case 'tree':
    case 'bush':
      return ramp(GREENS, colorIndex);
    case 'sun':
      return ramp(WARM, colorIndex);
    case 'cloud':
      return ramp(WHITES, colorIndex);
    case 'rock':
      return ramp(STONE, colorIndex);
    case 'mushroom':
      return ramp(CAPS, colorIndex);
    case 'house':
      return ramp(WALLS, colorIndex);
    case 'snail':
      return ramp(SHELL, colorIndex);
    default:
      // flower, balloon, kite, butterfly, star, bird — any bright hue is fine.
      return paletteColor(palette, colorIndex);
  }
}
