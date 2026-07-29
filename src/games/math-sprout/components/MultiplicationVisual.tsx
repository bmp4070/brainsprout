import styles from './MultiplicationVisual.module.css';

export interface MultiplicationVisualProps {
  a: number;
  b: number;
}

const DOT_EMOJI = '🔵';

/**
 * Teaching model for `a × b`: renders an array of `a` rows × `b` dots, so
 * "a groups of b" is visually obvious and countable.
 */
export default function MultiplicationVisual({ a, b }: MultiplicationVisualProps) {
  const rows = Array.from({ length: a }, (_, r) => r);
  const cols = Array.from({ length: b }, (_, c) => c);

  return (
    <div className={styles.wrap}>
      <div className={styles.grid} aria-hidden="true">
        {rows.map((r) => (
          <div key={r} className={styles.row}>
            {cols.map((c) => (
              <span key={c} className={styles.dot}>
                {DOT_EMOJI}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className={styles.caption}>
        {a} rows of {b}
      </p>
    </div>
  );
}
