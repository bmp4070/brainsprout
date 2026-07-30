/**
 * Catalogue of drawable scene elements for Spot the Difference.
 *
 * Scene space is a 0..100 x 0..100 square. Each item occupies an axis-aligned
 * box of `w x h` scene units at scale 1; the UI renders the kind's artwork
 * INSIDE that box. Every kind belongs to a vertical band ("zone") so scenes
 * read naturally: sky items float up top, ground items sit near the bottom, and
 * butterflies can roam anywhere.
 */

export type ItemKind =
  | 'sun' | 'cloud' | 'star' | 'balloon' | 'bird' | 'kite'
  | 'tree' | 'bush' | 'flower' | 'house' | 'mushroom' | 'rock' | 'butterfly' | 'snail';

export const ITEM_KINDS: ItemKind[] = [
  'sun', 'cloud', 'star', 'balloon', 'bird', 'kite',
  'tree', 'bush', 'flower', 'house', 'mushroom', 'rock', 'butterfly', 'snail',
];

/** Which vertical band an item belongs in. */
export type Zone = 'sky' | 'ground' | 'any';

/**
 * Base footprint (scene units, at scale 1) plus the item's home zone.
 * The UI draws each kind to fill this `w x h` box, so sizes must stay
 * consistent across kinds.
 */
export interface ItemSpec {
  w: number;
  h: number;
  zone: Zone;
}

export const ITEM_SPECS: Record<ItemKind, ItemSpec> = {
  // Sky items (y roughly 4..40).
  sun: { w: 14, h: 14, zone: 'sky' },
  cloud: { w: 20, h: 10, zone: 'sky' },
  star: { w: 8, h: 8, zone: 'sky' },
  balloon: { w: 10, h: 14, zone: 'sky' },
  bird: { w: 10, h: 7, zone: 'sky' },
  kite: { w: 10, h: 12, zone: 'sky' },
  // Ground items (y roughly 50..92).
  tree: { w: 16, h: 22, zone: 'ground' },
  bush: { w: 14, h: 10, zone: 'ground' },
  flower: { w: 8, h: 10, zone: 'ground' },
  house: { w: 20, h: 18, zone: 'ground' },
  mushroom: { w: 8, h: 9, zone: 'ground' },
  rock: { w: 12, h: 8, zone: 'ground' },
  snail: { w: 10, h: 7, zone: 'ground' },
  // Roams anywhere.
  butterfly: { w: 8, h: 8, zone: 'any' },
};
