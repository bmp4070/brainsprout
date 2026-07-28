import type { WordTheme } from '../lib/types';
import { wingsOfFire } from './wings-of-fire';
import { harryPotter } from './harry-potter';
import { percyJackson } from './percy-jackson';
import { dogMan } from './dog-man';
import { roaldDahl } from './roald-dahl';
import { narnia } from './narnia';
import { winnieThePooh } from './winnie-the-pooh';
import { aliceInWonderland } from './alice-in-wonderland';

export const themes: WordTheme[] = [
  wingsOfFire,
  harryPotter,
  percyJackson,
  dogMan,
  roaldDahl,
  narnia,
  winnieThePooh,
  aliceInWonderland,
];

export function getTheme(id: string): WordTheme | undefined {
  return themes.find((theme) => theme.id === id);
}
