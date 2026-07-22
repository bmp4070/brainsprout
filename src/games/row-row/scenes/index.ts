import { sunnyFjord } from './sunny-fjord';
import { sunsetFjord } from './sunset-fjord';
import { northernLightsFjord } from './northern-lights-fjord';
import type { RowRowScene } from './types';

export type { RowRowScene } from './types';
export { sceneToDataUri } from './types';

export const scenes: RowRowScene[] = [sunnyFjord, sunsetFjord, northernLightsFjord];
