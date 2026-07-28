import type { WordTheme } from '../lib/types';

const EASY_WORDS = ['ALICE', 'RABBIT', 'HATTER', 'QUEEN', 'KING', 'DODO', 'DINAH'];
const MEDIUM_EXTRA = ['DUCHESS', 'CHESHIRE', 'DORMOUSE', 'GRYPHON'];
const HARD_EXTRA = ['CATERPILLAR', 'MARCHHARE', 'MOCKTURTLE', 'KNAVE'];

const FACTS: Record<string, string> = {
  ALICE: "Alice is a curious girl who follows a White Rabbit down a rabbit hole into a strange and wonderful place called Wonderland.",
  RABBIT: "The White Rabbit is a nervous, fast-hopping rabbit who is always worried about being late and checking his pocket watch.",
  HATTER: "The Mad Hatter is a silly, tea-loving character who hosts a very strange and funny tea party that never seems to end.",
  QUEEN: "The Queen of Hearts is a bossy, dramatic queen who loves playing croquet and shouting orders at everyone in her garden.",
  KING: "The King of Hearts is the gentle, easily-confused king who sits quietly beside his much louder wife, the Queen.",
  DODO: "The Dodo is a funny bird who organizes a silly race called the Caucus Race where everybody wins a prize.",
  DINAH: "Dinah is Alice's own pet cat back home, who Alice often thinks and talks about during her Wonderland adventure.",
  DUCHESS: "The Duchess is a strange lady with a very peppery kitchen who owns a cat with an enormous, famous grin.",
  CHESHIRE: "The Cheshire Cat is a purple, grinning cat who can appear and disappear whenever he pleases, leaving just his smile behind.",
  DORMOUSE: "The Dormouse is a very sleepy little mouse who keeps falling asleep right in the middle of the tea party.",
  GRYPHON: "The Gryphon is a friendly creature, part eagle and part lion, who guides Alice to meet the Mock Turtle.",
  CATERPILLAR: "The Caterpillar is a wise, blue creature who sits on a mushroom smoking a pipe and asks Alice curious questions.",
  MARCHHARE: "The March Hare is a wild, silly rabbit-like character who lives with the Mad Hatter and loves the never-ending tea party.",
  MOCKTURTLE: "The Mock Turtle is a sad but sweet creature who loves telling stories and singing songs about his school days under the sea.",
  KNAVE: "The Knave of Hearts is a playing-card character accused of stealing the Queen's tarts in a very silly trial.",
};

export const aliceInWonderland: WordTheme = {
  id: 'alice-in-wonderland',
  title: 'Alice in Wonderland',
  emoji: '🐇',
  words: {
    easy: EASY_WORDS,
    medium: [...EASY_WORDS, ...MEDIUM_EXTRA],
    hard: [...EASY_WORDS, ...MEDIUM_EXTRA, ...HARD_EXTRA],
  },
  facts: FACTS,
};
