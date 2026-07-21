import type { Placement } from '../lib/types';
import type { FoundWord } from '../hooks/useWordSearch';
import styles from './WordList.module.css';

export interface WordListProps {
  placements: Placement[];
  found: FoundWord[];
}

export default function WordList({ placements, found }: WordListProps) {
  const colorByWord = new Map(found.map((f) => [f.word, f.colorIndex]));

  return (
    <ul className={styles.list}>
      {placements.map((placement) => {
        const colorIndex = colorByWord.get(placement.word);
        const isFound = colorIndex !== undefined;
        return (
          <li
            key={placement.word}
            className={`${styles.chip} ${isFound ? styles.found : ''}`}
            style={isFound ? { background: `var(--word-color-${colorIndex})` } : undefined}
          >
            {placement.word}
          </li>
        );
      })}
    </ul>
  );
}
