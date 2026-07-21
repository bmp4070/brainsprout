import type { WordTheme } from '../lib/types';

const EASY_WORDS = ['DOGMAN', 'PETEY', 'MOLLY', 'SARAH', 'CHIEF', 'ZUZU', 'GRAMPA', 'PIGGY'];
const MEDIUM_EXTRA = ['LILPETEY', 'BIGJIM', 'CRUNKY', 'BUB'];
const HARD_EXTRA = ['FLIPPY', 'NAOMI', 'SUMMER'];

const FACTS: Record<string, string> = {
  DOGMAN: "Dog Man has the head of a dog and the body of a police officer, after an amazing surgery saved his life. He's clumsy but always tries to do the right thing.",
  PETEY: "Petey is a supervillain cat who is secretly a genius inventor. Deep down, he's slowly learning how to be a better cat.",
  MOLLY: "Molly is a wise little frog from the Cat Kid Comic Club who is always full of clever ideas. She loves helping her brothers and sisters make comics.",
  SARAH: "Sarah Hatoff is a TV news reporter who covers all the wild adventures happening in Dog Man's town. She's always first on the scene.",
  CHIEF: "Chief is Dog Man's gruff police boss who acts tough but always looks out for his team. He's the one who first paired up Dog Man's head and body.",
  ZUZU: "Zuzu is Sarah Hatoff's feisty little poodle who isn't afraid to bite first and ask questions later. She's small but full of spunk.",
  GRAMPA: "Grampa is Petey's cranky dad and Li'l Petey's grandpa, and he's always cooking up a new scheme. Being nice is NOT his specialty!",
  PIGGY: "Piggy is a clever villain and leader of a group called the F.L.E.A.S. She's small, sneaky, and always plotting something.",
  LILPETEY: "Li'l Petey is a tiny kitten cloned from Petey who turns out to be sweet and kind. He helps Petey learn to be a better cat.",
  BIGJIM: "Big Jim is Petey's cellmate who secretly moonlights as a superhero named Commander Cupcake. He's tougher than he looks.",
  CRUNKY: "Crunky is a big, friendly gorilla who used to be a villain but joined the Friendly Friends instead. He's nice, if not the sharpest tool in the shed.",
  BUB: "Bub is Crunky's buddy who also gave up being a villain to join the Friendly Friends. The two of them love hanging out together.",
  FLIPPY: "Flippy is a fish with amazing mind powers who started out as a baddie but turned good. Now he takes care of a whole family of little frogs!",
  NAOMI: "Naomi is a bold little frog in the Cat Kid Comic Club with BIG opinions. She is never, ever shy about sharing them!",
  SUMMER: "Summer is one of the sweetest frogs in the Cat Kid Comic Club. She stays cheerful and kind no matter what happens.",
};

export const dogMan: WordTheme = {
  id: 'dog-man',
  title: 'Dog Man',
  emoji: '🐶',
  words: {
    easy: EASY_WORDS,
    medium: [...EASY_WORDS, ...MEDIUM_EXTRA],
    hard: [...EASY_WORDS, ...MEDIUM_EXTRA, ...HARD_EXTRA],
  },
  facts: FACTS,
};
