/**
 * Word Hunt reuses the curated, kid-safe word list built for Word Wheel
 * (~5,000 common words, ages 5-11 vetted) rather than duplicating it. On top of
 * it we build a PREFIX set once, so the board solver can prune any DFS branch
 * whose letters-so-far can't begin a real word — turning an exponential grid
 * search into a fast one.
 */
import { WORDS, WORD_SET, MIN_WORD_LEN } from '../../word-wheel/lib/dictionary';

export { WORDS, WORD_SET, MIN_WORD_LEN };

/** All proper prefixes (length >= 1) of every dictionary word, lowercased. */
export const PREFIXES: ReadonlySet<string> = (() => {
  const set = new Set<string>();
  for (const word of WORDS) {
    for (let i = 1; i <= word.length; i += 1) {
      set.add(word.slice(0, i));
    }
  }
  return set;
})();

/** True iff `s` starts at least one dictionary word (so a DFS may continue). */
export function isPrefix(s: string): boolean {
  return PREFIXES.has(s);
}

/** True iff `s` is a whole dictionary word. */
export function isWord(s: string): boolean {
  return WORD_SET.has(s);
}
