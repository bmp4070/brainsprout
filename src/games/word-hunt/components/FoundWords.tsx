import styles from './FoundWords.module.css';

export interface FoundWordsProps {
  found: string[];
  target: number;
  /** Total findable words on the board, shown as a stretch goal. */
  total: number;
}

/** The list of words the player has found, plus progress toward the target. */
export default function FoundWords({ found, target, total }: FoundWordsProps) {
  const remaining = Math.max(0, target - found.length);
  return (
    <div className={styles.panel}>
      <p className={styles.progress}>
        {found.length >= target ? (
          <>🎉 {found.length} words found!</>
        ) : (
          <>
            📝 {found.length}/{target} found · {remaining} to go
          </>
        )}
        <span className={styles.total}> (of {total} possible)</span>
      </p>
      <ul className={styles.list} aria-label="Words you found">
        {found.length === 0 && <li className={styles.empty}>Drag across letters to spell a word!</li>}
        {found
          .slice()
          .reverse()
          .map((word) => (
            <li key={word} className={styles.word}>
              {word}
            </li>
          ))}
      </ul>
    </div>
  );
}
