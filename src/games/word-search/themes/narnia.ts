import type { WordTheme } from '../lib/types';

const EASY_WORDS = ['LUCY', 'PETER', 'SUSAN', 'EDMUND', 'ASLAN', 'TUMNUS', 'CASPIAN'];
const MEDIUM_EXTRA = ['EUSTACE', 'JADIS', 'TRUMPKIN', 'TIRIAN'];
const HARD_EXTRA = ['REEPICHEEP', 'PUDDLEGLUM', 'CORNELIUS', 'GLIMFEATHER'];

const FACTS: Record<string, string> = {
  LUCY: "Lucy Pevensie is the youngest of the four Pevensie children and the very first to step through the magic wardrobe into Narnia.",
  PETER: "Peter Pevensie is the oldest brother, brave and fair, who becomes known as High King Peter after his Narnia adventures.",
  SUSAN: "Susan Pevensie is one of the four Pevensie children, known for being sensible and a wonderful archer.",
  EDMUND: "Edmund Pevensie is one of the four Pevensie siblings who travels to the snowy, magical land of Narnia.",
  ASLAN: "Aslan is the great and noble lion who guides and protects the magical land of Narnia.",
  TUMNUS: "Mr Tumnus is a friendly faun with curly horns who Lucy meets in the snowy woods of Narnia.",
  CASPIAN: "Prince Caspian is a brave young Telmarine prince who helps bring back Old Narnia's magic.",
  EUSTACE: "Eustace Scrubb is Lucy and Edmund's cousin who ends up on a wild sea voyage aboard the Dawn Treader.",
  JADIS: "Jadis is the powerful queen who rules over the snowy land of Narnia with icy magic.",
  TRUMPKIN: "Trumpkin is a loyal, gruff dwarf who helps Prince Caspian and doesn't believe in old legends at first.",
  TIRIAN: "Tirian is the last king of Narnia, brave and true, who protects his beloved kingdom.",
  REEPICHEEP: "Reepicheep is a small but incredibly brave mouse knight who dreams of sailing to the very end of the world.",
  PUDDLEGLUM: "Puddleglum is a tall, gloomy Marsh-wiggle who turns out to be one of the most loyal friends in Narnia.",
  CORNELIUS: "Doctor Cornelius is Prince Caspian's wise tutor who secretly teaches him about old Narnia.",
  GLIMFEATHER: "Glimfeather is a wise old owl who helps guide travelers through the nighttime skies of Narnia.",
};

export const narnia: WordTheme = {
  id: 'narnia',
  title: 'Narnia',
  emoji: '🦁',
  words: {
    easy: EASY_WORDS,
    medium: [...EASY_WORDS, ...MEDIUM_EXTRA],
    hard: [...EASY_WORDS, ...MEDIUM_EXTRA, ...HARD_EXTRA],
  },
  facts: FACTS,
};
