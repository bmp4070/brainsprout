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
  {
    id: 'shape-fit',
    title: 'Shape Fit',
    emoji: '🔷',
    path: '/games/shape-fit',
    description: 'Fit triangles, squares, and lines into the shape — rotate and flip to solve!',
    Component: lazy(() => import('./shape-fit/ShapeFitGame')),
  },
  {
    id: 'math-crossword',
    title: 'Math Crossword',
    emoji: '➗',
    path: '/games/math-crossword',
    description: 'Fill the missing numbers so every row and column is a true equation!',
    Component: lazy(() => import('./math-crossword/MathCrosswordGame')),
  },
  {
    id: 'word-wheel',
    title: 'Word Wheel',
    emoji: '🎡',
    path: '/games/word-wheel',
    description: 'Spin the letters and find every hidden word!',
    Component: lazy(() => import('./word-wheel/WordWheelGame')),
  },
  {
    id: 'maze',
    title: 'Maze',
    emoji: '🧭',
    path: '/games/maze',
    description: 'Find your way through the maze to the goal!',
    Component: lazy(() => import('./maze/MazeGame')),
  },
  {
    id: 'spot-difference',
    title: 'Spot the Difference',
    emoji: '👀',
    path: '/games/spot-difference',
    description: "Find what's different between the two pictures!",
    Component: lazy(() => import('./spot-difference/SpotDifferenceGame')),
  },
  {
    id: 'memory-belt',
    title: 'Memory Belt',
    emoji: '🧠',
    path: '/games/memory-belt',
    description: 'Memorize the items, then catch them on the conveyor belt!',
    Component: lazy(() => import('./memory-belt/MemoryBeltGame')),
  },
  {
    id: 'word-hunt',
    title: 'Word Hunt',
    emoji: '🔤',
    path: '/games/word-hunt',
    description: 'Drag across touching letters to spell as many words as you can!',
    Component: lazy(() => import('./word-hunt/WordHuntGame')),
  },
];
