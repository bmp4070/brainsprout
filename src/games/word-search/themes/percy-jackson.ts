import type { WordTheme } from '../lib/types';

const EASY_WORDS = ['PERCY', 'GROVER', 'ZEUS', 'NICO', 'HADES', 'THALIA'];
const MEDIUM_EXTRA = ['ANNABETH', 'POSEIDON', 'CHIRON'];
const HARD_EXTRA = ['CLARISSE', 'BLACKJACK', 'DIONYSUS'];

const FACTS: Record<string, string> = {
  PERCY: "Percy Jackson is a demigod son of Poseidon who can control water and breathe underwater. He's braver than he realizes and always protects his friends.",
  GROVER: "Grover Underwood is a satyr, half-goat and half-human, who is Percy's loyal best friend. He plays magical music on his reed pipes.",
  ZEUS: "Zeus is the king of the Greek gods and rules the sky with his mighty lightning bolt. He can be pretty grumpy when he's not respected!",
  NICO: "Nico di Angelo is a demigod son of Hades who can talk to ghosts and shadow-travel. He's quiet, mysterious, and fiercely loyal.",
  HADES: "Hades is the god of the Underworld who rules over the realm of the dead. He's often misunderstood, since he's not actually evil!",
  THALIA: "Thalia Grace is a demigod daughter of Zeus who leads the Hunters of Artemis. She's tough, loyal, and great with a bow.",
  ANNABETH: "Annabeth Chase is a demigod daughter of Athena who dreams of designing amazing buildings. She's one of the smartest heroes at camp.",
  POSEIDON: "Poseidon is the god of the sea, earthquakes, and horses, and Percy's godly dad. He rules the ocean from an underwater palace.",
  CHIRON: "Chiron is a wise centaur who trains young heroes at Camp Half-Blood. He's been teaching demigods for thousands of years.",
  CLARISSE: "Clarisse La Rue is a demigod daughter of Ares who loves a good fight. Beneath her tough attitude, she's a loyal friend.",
  BLACKJACK: "Blackjack is a Pegasus, a flying horse, who is Percy's loyal friend and loves donuts. He can even talk to Percy inside his head!",
  DIONYSUS: "Dionysus is the god of wine and grapes who runs Camp Half-Blood, even though he'd rather be somewhere else. Campers call him Mr. D.",
};

export const percyJackson: WordTheme = {
  id: 'percy-jackson',
  title: 'Percy Jackson',
  emoji: '⚡',
  words: {
    easy: EASY_WORDS,
    medium: [...EASY_WORDS, ...MEDIUM_EXTRA],
    hard: [...EASY_WORDS, ...MEDIUM_EXTRA, ...HARD_EXTRA],
  },
  facts: FACTS,
};
