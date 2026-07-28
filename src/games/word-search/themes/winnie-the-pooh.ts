import type { WordTheme } from '../lib/types';

const EASY_WORDS = ['POOH', 'ROO', 'OWL', 'KANGA', 'WINNIE', 'PIGLET', 'TIGGER'];
const MEDIUM_EXTRA = ['RABBIT', 'EEYORE', 'LUMPY', 'GOPHER'];
const HARD_EXTRA = ['WOOZLE', 'HEFFALUMP', 'CHRISTOPHER'];

const FACTS: Record<string, string> = {
  POOH: "Winnie the Pooh is a friendly, hunny-loving bear who lives in the Hundred Acre Wood with all his best friends.",
  ROO: "Roo is Kanga's cheerful little joey who loves to bounce around and play with his friends in the Hundred Acre Wood.",
  OWL: "Owl is a wise old bird who loves giving long, fancy speeches and lives in a cozy tree house.",
  KANGA: "Kanga is Roo's gentle, caring mother who looks after all her friends in the Hundred Acre Wood.",
  WINNIE: "Winnie is the short, friendly name everyone calls the honey-loving bear who lives in the Hundred Acre Wood.",
  PIGLET: "Piglet is a very small, very kind pig who is one of Pooh's best and most loyal friends.",
  TIGGER: "Tigger is a bouncy, bubbly tiger who loves to bounce on his springy tail and says he's the only one of his kind.",
  RABBIT: "Rabbit is a busy, organized friend who loves his garden and is always making plans for everyone.",
  EEYORE: "Eeyore is a gray donkey with a droopy tail who speaks slowly but is always glad to see his friends.",
  LUMPY: "Lumpy is a bouncy young heffalump who becomes friends with Roo and joins in all sorts of games.",
  GOPHER: "Gopher is a burrowing critter who pops up out of the ground to help his Hundred Acre Wood friends.",
  WOOZLE: "A Woozle is a mysterious creature that Pooh and Piglet once imagined was tracking them through the snow.",
  HEFFALUMP: "A Heffalump is a big, friendly elephant-like creature that Pooh and Piglet used to think was scary.",
  CHRISTOPHER: "Christopher Robin is the kind boy who loves visiting the Hundred Acre Wood and playing with all his animal friends.",
};

export const winnieThePooh: WordTheme = {
  id: 'winnie-the-pooh',
  title: 'Winnie the Pooh',
  emoji: '🐻',
  words: {
    easy: EASY_WORDS,
    medium: [...EASY_WORDS, ...MEDIUM_EXTRA],
    hard: [...EASY_WORDS, ...MEDIUM_EXTRA, ...HARD_EXTRA],
  },
  facts: FACTS,
};
