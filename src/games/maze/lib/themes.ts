export interface MazeTheme {
  id: string;
  character: string;
  goal: string;
  name: string;
}

/** Rotating cast of character -> goal pairs, for a little charm per play. */
export const MAZE_THEMES: MazeTheme[] = [
  { id: 'mouse', character: '🐭', goal: '🧀', name: 'Mouse' },
  { id: 'bunny', character: '🐰', goal: '🥕', name: 'Bunny' },
  { id: 'bee', character: '🐝', goal: '🌻', name: 'Bee' },
  { id: 'dragon', character: '🐉', goal: '🏰', name: 'Dragon' },
  { id: 'cat', character: '🐱', goal: '🐟', name: 'Cat' },
  { id: 'squirrel', character: '🐿️', goal: '🌰', name: 'Squirrel' },
];
