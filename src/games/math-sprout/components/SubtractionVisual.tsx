import styles from './SubtractionVisual.module.css';

export interface SubtractionVisualProps {
  a: number;
  b: number;
  answer: number;
}

const ITEM_EMOJI = '🍎';
/** Group items into rows of ten (ten-frames) so large `a` (hard tier, up to
 * 99) stays countable instead of one giant blob. */
const ROW_SIZE = 10;

/**
 * Teaching model for `a − b`: renders `a` items, fades/crosses out the last
 * `b` of them ("taken away"), and leaves the first `answer` highlighted so a
 * kid can count what's left.
 */
export default function SubtractionVisual({ a, b, answer }: SubtractionVisualProps) {
  const rows: number[][] = [];
  for (let start = 0; start < a; start += ROW_SIZE) {
    rows.push(
      Array.from({ length: Math.min(ROW_SIZE, a - start) }, (_, i) => start + i),
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.grid} aria-hidden="true">
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className={styles.row}>
            {row.map((i) => {
              const takenAway = i >= answer;
              return (
                <span
                  key={i}
                  className={takenAway ? styles.itemTaken : styles.itemRemaining}
                >
                  {ITEM_EMOJI}
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className={styles.caption}>
        {a} take away {b} leaves {answer}
      </p>
    </div>
  );
}
