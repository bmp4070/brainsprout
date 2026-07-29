import styles from './WordSlots.module.css';

export interface WordSlotsProps {
  /** Target words, lowercase, sorted by length then alpha (Puzzle.words as-is). */
  words: string[];
  found: string[];
  /** Letters revealed (from the start) per word, via hints. */
  revealed: Record<string, number>;
  side?: 'left' | 'right' | 'all';
}

interface LengthGroup {
  length: number;
  words: string[];
}

/** Groups an already length-sorted word list into contiguous same-length runs. */
function groupByLength(words: string[]): LengthGroup[] {
  const groups: LengthGroup[] = [];
  for (const word of words) {
    const last = groups[groups.length - 1];
    if (last && last.length === word.length) {
      last.words.push(word);
    } else {
      groups.push({ length: word.length, words: [word] });
    }
  }
  return groups;
}

const WORD_COLOR_COUNT = 6;

export default function WordSlots({ words, found, revealed, side = 'all' }: WordSlotsProps) {
  const half = Math.ceil(words.length / 2);
  const displayedWords =
    side === 'left'
      ? words.slice(0, half)
      : side === 'right'
        ? words.slice(half)
        : words;

  if (displayedWords.length === 0) {
    return null;
  }

  const groups = groupByLength(displayedWords);
  const foundSet = new Set(found);

  return (
    <div className={styles.wrap}>
      {groups.map((group) => (
        <div key={group.length} className={styles.group}>
          <p className={styles.groupLabel}>
            {group.length}-letter words ({group.words.length})
          </p>
          <div className={styles.rows}>
            {group.words.map((word) => {
              const isFound = foundSet.has(word);
              const revealCount = revealed[word] ?? 0;
              const colorIndex = words.indexOf(word) % WORD_COLOR_COUNT;
              return (
                <div
                  key={word}
                  className={`${styles.row} ${isFound ? styles.rowFound : ''}`}
                  style={isFound ? { background: `var(--word-color-${colorIndex})` } : undefined}
                >
                  {word.split('').map((letter, i) => {
                    const show = isFound || i < revealCount;
                    return (
                      <span key={i} className={styles.tile}>
                        {show ? letter.toUpperCase() : ''}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
