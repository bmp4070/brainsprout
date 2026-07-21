import type { WordTheme } from '../lib/types';
import { wingsOfFire } from './wings-of-fire';
import { harryPotter } from './harry-potter';
import { percyJackson } from './percy-jackson';
import { dogMan } from './dog-man';
import { roaldDahl } from './roald-dahl';

export const themes: WordTheme[] = [
  wingsOfFire,
  harryPotter,
  percyJackson,
  dogMan,
  roaldDahl,
];

export function getTheme(id: string): WordTheme | undefined {
  return themes.find((theme) => theme.id === id);
}
