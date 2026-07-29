import { mulberry32 } from '../../../shared/lib/rng';
import { MIN_WORD_LEN, WORDS } from './dictionary';
import type { DifficultyConfig, Puzzle } from './types';

const A_CODE = 'a'.charCodeAt(0);

/** Max 3-letter words allowed in any single puzzle. */
const MAX_THREE_LETTER_WORDS = 3;

/**
 * How many base-word candidates we probe before giving up on an exact fit and
 * falling back to the closest one. Bounded so generation never runs long.
 */
const MAX_CANDIDATE_SCAN = 400;

/** Precomputed, immutable per-word data for fast subword scanning. */
interface WordIndex {
  /** Bitmask of distinct letters (bit i == letter 'a'+i present). */
  mask: Int32Array;
  /** Flattened 26-wide letter-count vectors: counts[i*26 + c]. */
  counts: Int8Array;
  /** Word length. */
  len: Int8Array;
  /** 1 iff every letter in the word is distinct. */
  distinct: Uint8Array;
}

let indexCache: WordIndex | null = null;

/** Builds (once, memoized) the per-word letter index over the whole dictionary. */
function getIndex(): WordIndex {
  if (indexCache !== null) return indexCache;
  const n = WORDS.length;
  const mask = new Int32Array(n);
  const counts = new Int8Array(n * 26);
  const len = new Int8Array(n);
  const distinct = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const w = WORDS[i];
    len[i] = w.length;
    let m = 0;
    for (let k = 0; k < w.length; k++) {
      const c = w.charCodeAt(k) - A_CODE;
      counts[i * 26 + c]++;
      m |= 1 << c;
    }
    mask[i] = m;
    let bits = 0;
    let mm = m;
    while (mm !== 0) {
      bits += mm & 1;
      mm >>>= 1;
    }
    distinct[i] = bits === w.length ? 1 : 0;
  }
  indexCache = { mask, counts, len, distinct };
  return indexCache;
}

/** Fisher-Yates shuffle in place using the supplied PRNG. */
function shuffle<T>(rng: () => number, arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

/** Letter-count vector (length 26) and distinct-letter bitmask for a word. */
function rackVector(word: string): { vec: Int8Array; mask: number } {
  const vec = new Int8Array(26);
  let mask = 0;
  for (let k = 0; k < word.length; k++) {
    const c = word.charCodeAt(k) - A_CODE;
    vec[c]++;
    mask |= 1 << c;
  }
  return { vec, mask };
}

/**
 * Collects dictionary words spellable from the given rack letters.
 */
function collectTargets(idx: WordIndex, rackVec: Int8Array, rackMask: number): string[] {
  const notRack = ~rackMask;
  const out: string[] = [];
  const n = WORDS.length;
  for (let i = 0; i < n; i++) {
    if (idx.len[i] < MIN_WORD_LEN) continue;
    if ((idx.mask[i] & notRack) !== 0) continue;
    const base = i * 26;
    let ok = true;
    let m = idx.mask[i];
    while (m !== 0) {
      const c = 31 - Math.clz32(m & -m);
      if (idx.counts[base + c] > rackVec[c]) {
        ok = false;
        break;
      }
      m &= m - 1;
    }
    if (ok) out.push(WORDS[i]);
  }
  return out;
}

/**
 * Caps the number of 3-letter words to at most MAX_THREE_LETTER_WORDS (3),
 * using the PRNG to select 3 diverse candidates when there are more.
 */
function limitThreeLetterWords(targets: string[], baseWord: string, rng: () => number): string[] {
  const threeLetter = targets.filter((w) => w.length === 3 && w !== baseWord);
  const otherWords = targets.filter((w) => w.length !== 3 || w === baseWord);

  if (threeLetter.length <= MAX_THREE_LETTER_WORDS) {
    return targets;
  }

  const shuffled = [...threeLetter];
  shuffle(rng, shuffled);
  const selected = shuffled.slice(0, MAX_THREE_LETTER_WORDS);

  return [...otherWords, ...selected];
}

/** Orders words by length ascending, then alphabetically. */
function byLengthThenAlpha(a: string, b: string): number {
  if (a.length !== b.length) return a.length - b.length;
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Generates a deterministic Word Wheel puzzle for the given difficulty + seed.
 */
export function generatePuzzle(difficulty: DifficultyConfig, seed: number): Puzzle {
  const rng = mulberry32(seed);
  const idx = getIndex();
  const { baseLenMin, baseLenMax, minWords, maxWords } = difficulty;

  const distinctCandidates: string[] = [];
  const repeatedCandidates: string[] = [];
  for (let i = 0; i < WORDS.length; i++) {
    const l = idx.len[i];
    if (l < baseLenMin || l > baseLenMax) continue;
    if (idx.distinct[i] === 1) distinctCandidates.push(WORDS[i]);
    else repeatedCandidates.push(WORDS[i]);
  }
  shuffle(rng, distinctCandidates);
  shuffle(rng, repeatedCandidates);
  const candidates = [...distinctCandidates, ...repeatedCandidates];

  let chosenBase: string | null = null;
  let chosenTargets: string[] | null = null;
  let bestBase: string | null = null;
  let bestTargets: string[] | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  const scanLimit = Math.min(candidates.length, MAX_CANDIDATE_SCAN);
  for (let i = 0; i < scanLimit; i++) {
    const base = candidates[i];
    const { vec, mask } = rackVector(base);
    const rawTargets = collectTargets(idx, vec, mask);
    const targets = limitThreeLetterWords(rawTargets, base, rng);
    const count = targets.length;

    if (count >= minWords && count <= maxWords) {
      chosenBase = base;
      chosenTargets = targets;
      break;
    }

    const distance = count < minWords ? minWords - count : count - maxWords;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestBase = base;
      bestTargets = targets;
    }
  }

  let baseWord = chosenBase;
  let targets = chosenTargets;
  if (baseWord === null || targets === null) {
    baseWord = bestBase ?? candidates[0] ?? WORDS[0];
    targets =
      bestTargets ??
      (() => {
        const { vec, mask } = rackVector(baseWord as string);
        return limitThreeLetterWords(collectTargets(idx, vec, mask), baseWord as string, rng);
      })();
  }

  const targetSet = new Set(targets);
  targetSet.add(baseWord);
  if (targetSet.size > maxWords) {
    const others = [...targetSet].filter((w) => w !== baseWord).sort(byLengthThenAlpha);
    const kept = new Set<string>([baseWord]);
    for (const w of others) {
      if (kept.size >= maxWords) break;
      kept.add(w);
    }
    targets = [...kept];
  } else {
    targets = [...targetSet];
  }

  const words = targets.sort(byLengthThenAlpha);

  const letters = baseWord.toUpperCase().split('');
  shuffle(rng, letters);

  return {
    letters,
    baseWord: baseWord.toUpperCase(),
    words,
    seed,
  };
}
