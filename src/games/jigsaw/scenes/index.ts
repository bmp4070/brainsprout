import { friendlyDragon } from './friendly-dragon';
import { outerSpace } from './outer-space';
import { underTheSea } from './under-the-sea';
import { jungle } from './jungle';
import { flamingos } from './flamingos';
import { penguins } from './penguins';
import { farm } from './farm';
import type { JigsawScene } from './types';

export type { JigsawScene } from './types';
export { sceneToDataUri } from './types';

export const scenes: JigsawScene[] = [
  friendlyDragon,
  outerSpace,
  underTheSea,
  jungle,
  flamingos,
  penguins,
  farm,
];
