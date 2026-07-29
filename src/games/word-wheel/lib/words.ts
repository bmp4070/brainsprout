/**
 * Pure multiset helpers for spelling words from a rack of letters.
 * All functions are case-insensitive and perform no I/O.
 */

/** Multiset letter counts of a word (case-insensitive; result keyed lowercase). */
export function letterCounts(word: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ch of word.toLowerCase()) {
    counts[ch] = (counts[ch] ?? 0) + 1;
  }
  return counts;
}

/**
 * True iff `word` can be spelled from the multiset of `rack` letters, using
 * each rack tile at most once (a letter may be reused only as many times as it
 * appears in `rack`). Case-insensitive. An empty word is trivially makeable.
 */
export function canMake(word: string, rack: string[]): boolean {
  const available = letterCounts(rack.join(''));
  const needed = letterCounts(word);
  for (const ch in needed) {
    if ((available[ch] ?? 0) < needed[ch]) {
      return false;
    }
  }
  return true;
}
