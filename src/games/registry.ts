import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';

export interface GameMeta {
  id: string;
  title: string;
  emoji: string;
  path: string;
  description: string;
  Component: LazyExoticComponent<ComponentType>;
}

export const games: GameMeta[] = [
  {
    id: 'word-search',
    title: 'Word Search',
    emoji: '🔍',
    path: '/games/word-search',
    description: 'Find hidden words in a grid of letters!',
    Component: lazy(() => import('./word-search/WordSearchGame')),
  },
  {
    id: 'jigsaw',
    title: 'Jigsaw Puzzle',
    emoji: '🧩',
    path: '/games/jigsaw',
    description: 'Drag and drop pieces to complete a colorful picture!',
    Component: lazy(() => import('./jigsaw/JigsawGame')),
  },
  {
    id: 'cat-nap',
    title: 'Cat Nap',
    emoji: '🐱',
    path: '/games/cat-nap',
    description: 'Tuck a sleepy cat into every color — no touching, no sharing rows!',
    Component: lazy(() => import('./cat-nap/CatNapGame')),
  },
  {
    id: 'bus-route',
    title: 'School Bus Route',
    emoji: '🚌',
    path: '/games/bus-route',
    description: 'Plan the shortest bus route — pick up every kid and get back to school!',
    Component: lazy(() => import('./bus-route/BusRouteGame')),
  },
  {
    id: 'potion-sort',
    title: 'Potion Sort',
    emoji: '🧪',
    path: '/games/potion-sort',
    description: 'Pour the magic potions until every bottle is one pure color!',
    Component: lazy(() => import('./potion-sort/PotionSortGame')),
  },
];
