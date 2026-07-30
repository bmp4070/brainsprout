import type { ItemKind } from './items';

/**
 * A visual theme for a Spot the Difference scene. The UI reads `skyColor` /
 * `groundColor` for the two backdrop bands and resolves each item's
 * `colorIndex` (0..6) against `palette` — so `palette` MUST hold exactly 7
 * entries. `kinds`, when present, biases which item kinds the generator favours
 * for this theme (other kinds may still appear as filler).
 */
export interface Theme {
  id: string;
  name: string;
  emoji: string;
  skyColor: string;
  groundColor: string;
  /** Exactly 7 hex colours, indexed by SceneItem.colorIndex 0..6. */
  palette: string[];
  /** Optional bias: kinds this theme leans on. */
  kinds?: ItemKind[];
}

export const THEMES: Theme[] = [
  {
    id: 'park',
    name: 'Park',
    emoji: '🌳',
    skyColor: '#bfe6ff',
    groundColor: '#8fd06a',
    palette: ['#e14b4b', '#f2a33c', '#ffd93d', '#5fbf5f', '#4aa3e0', '#8a63d2', '#ff8fb1'],
    kinds: ['tree', 'bush', 'flower', 'butterfly', 'bird', 'cloud', 'sun', 'kite'],
  },
  {
    id: 'beach',
    name: 'Beach',
    emoji: '🏖️',
    skyColor: '#cdf0ff',
    groundColor: '#f4dda0',
    palette: ['#ff6b4a', '#ffb347', '#ffe066', '#3ec6c6', '#3f8ede', '#a06cd5', '#ff9ec4'],
    kinds: ['sun', 'cloud', 'bird', 'kite', 'balloon', 'rock', 'snail', 'star'],
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    skyColor: '#241a4a',
    groundColor: '#4a3d6b',
    palette: ['#ff5d73', '#ffa23e', '#ffe14d', '#63e6be', '#5aa9ff', '#b085ff', '#ff9ad5'],
    kinds: ['star', 'balloon', 'rock', 'cloud', 'sun', 'house', 'bird'],
  },
  {
    id: 'farm',
    name: 'Farm',
    emoji: '🐮',
    skyColor: '#cceaff',
    groundColor: '#a7cf6a',
    palette: ['#d84b3f', '#f0983a', '#ffd84d', '#6cbf59', '#4f9fd6', '#9a6fd0', '#ff9bb3'],
    kinds: ['house', 'tree', 'bush', 'flower', 'mushroom', 'bird', 'cloud', 'sun', 'snail'],
  },
];

/** Looks up a theme by id, falling back to the first theme when unknown. */
export function getTheme(themeId: string): Theme {
  return THEMES.find((t) => t.id === themeId) ?? THEMES[0];
}
