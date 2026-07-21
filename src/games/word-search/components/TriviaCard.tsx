import type { FoundWord } from '../hooks/useWordSearch';
import type { WordTheme } from '../lib/types';
import styles from './TriviaCard.module.css';

export interface TriviaCardProps {
  theme: WordTheme;
  latestFound: FoundWord | null;
}

export default function TriviaCard({ theme, latestFound }: TriviaCardProps) {
  if (!latestFound) {
    return (
      <div className={styles.card} role="status" aria-live="polite">
        <p className={styles.placeholder}>
          Find a character to learn about them! 🔎
        </p>
      </div>
    );
  }

  const fact = theme.facts[latestFound.word];

  return (
    <div className={styles.card} role="status" aria-live="polite">
      <p className={styles.header}>⭐ You found…</p>
      <p
        className={styles.name}
        style={{
          borderBottomColor: `var(--word-color-${latestFound.colorIndex})`,
        }}
      >
        {theme.emoji} {latestFound.word}
      </p>
      {fact && <p className={styles.fact}>{fact}</p>}
    </div>
  );
}
