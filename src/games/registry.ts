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
];
