import type { WordTheme } from '../lib/types';

const EASY_WORDS = ['WONKA', 'DANNY', 'JAMES', 'SOPHIE', 'MATILDA', 'CHARLIE', 'GEORGE'];
const MEDIUM_EXTRA = ['VERUCA', 'AUGUSTUS', 'VIOLET', 'TEAVEE'];
const HARD_EXTRA = ['TRUNCHBULL', 'MISSHONEY', 'BONECRUNCHER', 'BLOODBOTTLER'];

const FACTS: Record<string, string> = {
  WONKA: "Willy Wonka is the mysterious owner of the world's most amazing chocolate factory. He loves inventing wonderful, wacky sweets!",
  DANNY: "Danny is a boy who lives in a cozy little caravan with his dad and goes on a daring nighttime adventure to catch pheasants.",
  JAMES: "James Henry Trotter is a boy who escapes his horrid aunts by climbing inside a giant magic peach and rolling off on an adventure.",
  SOPHIE: "Sophie is a brave orphan girl who gets whisked away by a giant one night and discovers he's actually friendly and kind.",
  MATILDA: "Matilda Wormwood is a super-smart little girl who loves reading books and discovers she has amazing magical powers.",
  CHARLIE: "Charlie Bucket is a poor but kind boy who wins a Golden Ticket to tour Willy Wonka's incredible chocolate factory.",
  GEORGE: "George is a boy who cooks up a wild magic medicine in his grandma's kitchen, with some very unexpected results.",
  VERUCA: "Veruca Salt is a spoiled girl who always gets whatever she demands from her parents. She wants everything, right now!",
  AUGUSTUS: "Augustus Gloop is a boy who loves chocolate more than anything else in the whole world and can never say no to a treat.",
  VIOLET: "Violet Beauregarde is a girl who is obsessed with chewing gum and brags about setting gum-chewing records.",
  TEAVEE: "Mike Teavee is a boy who is completely glued to his television set and loves anything to do with gadgets and screens.",
  TRUNCHBULL: "Miss Trunchbull is the strict, thunderous headmistress of Matilda's school who used to be a champion hammer thrower.",
  MISSHONEY: "Miss Honey is Matilda's sweet, gentle teacher who quickly notices how brilliant and special Matilda really is.",
  BONECRUNCHER: "The Bonecruncher is one of the giants in The BFG, bigger and grumpier than the BFG himself, with a very silly, scary name.",
  BLOODBOTTLER: "The Bloodbottler is one of the giants in The BFG who has a name that sounds scarier than it looks, just like his giant friends.",
};

export const roaldDahl: WordTheme = {
  id: 'roald-dahl',
  title: 'Roald Dahl',
  emoji: '🍫',
  words: {
    easy: EASY_WORDS,
    medium: [...EASY_WORDS, ...MEDIUM_EXTRA],
    hard: [...EASY_WORDS, ...MEDIUM_EXTRA, ...HARD_EXTRA],
  },
  facts: FACTS,
};
