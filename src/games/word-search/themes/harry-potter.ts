import type { WordTheme } from '../lib/types';

const EASY_WORDS = ['HARRY', 'DOBBY', 'HAGRID', 'GINNY', 'LUNA', 'SNAPE'];
const MEDIUM_EXTRA = ['HERMIONE', 'NEVILLE', 'MALFOY', 'WEASLEY'];
const HARD_EXTRA = ['DUMBLEDORE', 'VOLDEMORT', 'MCGONAGALL'];

const FACTS: Record<string, string> = {
  HARRY: "Harry Potter is a young wizard who goes to Hogwarts School and has a lightning-bolt scar on his forehead. He's braver than he thinks!",
  DOBBY: "Dobby is a house-elf who adores Harry and wants to help him however he can. Dobby is a free elf who gets to wear whatever silly socks he likes!",
  HAGRID: "Hagrid is the kind, giant-sized groundskeeper at Hogwarts who adores magical creatures. He was the one who first told Harry he's a wizard.",
  GINNY: "Ginny Weasley is a clever, fearless witch who is great at Quidditch. She never lets anyone tell her what she can't do.",
  LUNA: "Luna Lovegood is a witch at Hogwarts who believes in magical creatures nobody else has seen. She marches to her own beat and is proud of it.",
  SNAPE: "Severus Snape is the Potions professor at Hogwarts, known for being extremely strict. There's a lot more to him than most students realize.",
  HERMIONE: "Hermione Granger is one of the smartest witches at Hogwarts and always has her nose in a book. Her quick thinking saves the day again and again.",
  NEVILLE: "Neville Longbottom starts out nervous at Hogwarts but grows braver every year. He loves plants and turns out to be a true hero.",
  MALFOY: "Draco Malfoy is a Slytherin student who loves to boast about his family. He and Harry are rivals from their very first train ride.",
  WEASLEY: "The Weasleys are a big, warm, red-haired wizarding family who treat Harry like one of their own. Their house is full of magic and laughter.",
  DUMBLEDORE: "Albus Dumbledore is the wise headmaster of Hogwarts who always seems to have a plan. He believes everyone deserves a second chance.",
  VOLDEMORT: "Voldemort is a powerful dark wizard so feared that people call him 'You-Know-Who.' Even his name makes wizards nervous!",
  MCGONAGALL: "Professor McGonagall teaches Transfiguration at Hogwarts and can turn into a cat. She's strict but always fair to her students.",
};

export const harryPotter: WordTheme = {
  id: 'harry-potter',
  title: 'Harry Potter',
  emoji: '🧙',
  words: {
    easy: EASY_WORDS,
    medium: [...EASY_WORDS, ...MEDIUM_EXTRA],
    hard: [...EASY_WORDS, ...MEDIUM_EXTRA, ...HARD_EXTRA],
  },
  facts: FACTS,
};
