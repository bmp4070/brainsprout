import type { WordTheme } from '../lib/types';

const EASY_WORDS = ['CLAY', 'SUNNY', 'GLORY', 'MOON', 'PERIL', 'WINTER'];
const MEDIUM_EXTRA = ['TSUNAMI', 'TURTLE', 'QIBLI', 'ANEMONE'];
const HARD_EXTRA = [
  'STARFLIGHT',
  'KINKAJOU',
  'FATESPEAKER',
  'DARKSTALKER',
];

const FACTS: Record<string, string> = {
  CLAY: "Clay is a MudWing dragon who can survive fire when he's covered in mud. He cares about his friends more than anything!",
  SUNNY: "Sunny is a SandWing dragon with unusual golden scales and no tail barb. She always looks for the bright side of everything!",
  GLORY: "Glory is a RainWing dragon who can shoot venom from her fangs and change her scale colors. She's much cleverer than anyone expects!",
  MOON: "Moonwatcher is a NightWing dragon who can read minds and see glimpses of the future. She just wants to be honest and kind.",
  PERIL: "Peril is a SkyWing dragon born with scales so hot they can burn almost anything she touches. She dreams of a gentle touch someday.",
  WINTER: "Winter is an IceWing dragon who tries hard to make his family proud. Underneath his icy pride, he's actually really brave.",
  TSUNAMI: "Tsunami is a SeaWing dragon princess who loves to lead and protect her friends. She's tough, loud, and totally fearless.",
  TURTLE: "Turtle is a SeaWing dragon with secret animus magic who pretends he isn't very special. He'd rather crack a joke than brag.",
  QIBLI: "Qibli is a SandWing dragon with a talent for reading other dragons and telling jokes. He dreams of becoming a legendary hero.",
  ANEMONE: "Anemone is a young SeaWing dragon princess with powerful animus magic. She just wants someone to play with!",
  STARFLIGHT: "Starflight is a NightWing dragon who loves books more than anything and knows tons of dragon history. He's the smartest dragonet around.",
  KINKAJOU: "Kinkajou is a cheerful RainWing dragon who is always ready to make a new friend. Her energy is contagious!",
  FATESPEAKER: "Fatespeaker is a NightWing dragon who loves telling stories, even when she's not totally sure they're true. She's full of hope.",
  DARKSTALKER: "Darkstalker is a NightWing dragon from a thousand years ago with powerful animus magic. His story is full of mystery.",
};

export const wingsOfFire: WordTheme = {
  id: 'wings-of-fire',
  title: 'Wings of Fire Dragons',
  emoji: '🐉',
  words: {
    easy: EASY_WORDS,
    medium: [...EASY_WORDS, ...MEDIUM_EXTRA],
    hard: [...EASY_WORDS, ...MEDIUM_EXTRA, ...HARD_EXTRA],
  },
  facts: FACTS,
};
