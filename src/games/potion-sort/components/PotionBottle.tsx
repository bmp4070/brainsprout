import type { Bottle } from '../lib/types';
import { CAPACITY } from '../lib/types';
import { colorName } from '../palette';
import styles from './PotionBottle.module.css';

export interface PotionBottleProps {
  bottle: Bottle;
  selected: boolean;
  /** Number of top layers currently "lifted" -- topRunLength(bottle) while selected, else 0. */
  liftedCount: number;
  /** True when the bottle is full and holds a single pure color. */
  complete: boolean;
  hinted: 'from' | 'to' | null;
  onTap: (index: number) => void;
  disabled: boolean;
  index: number;
}

/** Describes a bottle's contents for screen readers, e.g. "top color Ruby Red, 2 layers". */
function describeBottle(bottle: Bottle): string {
  if (bottle.length === 0) return 'empty bottle';
  const top = bottle[bottle.length - 1];
  let count = 0;
  for (let i = bottle.length - 1; i >= 0 && bottle[i] === top; i--) count++;
  return `top color ${colorName(top)}, ${count} layer${count === 1 ? '' : 's'}`;
}

export default function PotionBottle({
  bottle,
  selected,
  liftedCount,
  complete,
  hinted,
  onTap,
  disabled,
  index,
}: PotionBottleProps) {
  // Render top-of-stack first so a plain flex column places it visually at
  // the top of the glass; the bottom-most color (bottle[0]) ends up last.
  const topDown = [...bottle].reverse();
  const emptySlots = CAPACITY - bottle.length;
  const hintClass = hinted === 'from' ? styles.hintFrom : hinted === 'to' ? styles.hintTo : '';

  return (
    <button
      type="button"
      className={`${styles.button} ${selected ? styles.selected : ''} ${hintClass}`}
      onClick={() => onTap(index)}
      disabled={disabled}
      aria-label={`Bottle ${index + 1}, ${describeBottle(bottle)}`}
      aria-pressed={selected}
    >
      <div className={styles.neck} aria-hidden="true" />
      <div className={styles.body} aria-hidden="true">
        {Array.from({ length: emptySlots }, (_, i) => (
          <div key={`air-${i}`} className={styles.air} />
        ))}
        {topDown.map((color, j) => {
          const isLifted = selected && j < liftedCount;
          const isTopLayer = j === 0;
          return (
            <div
              key={j}
              className={[
                styles.layer,
                styles[`color${color}`] ?? '',
                isLifted ? styles.lifted : '',
                isTopLayer ? styles.topLayer : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={isLifted ? { transform: `translateY(-${(liftedCount - j) * 5}px)` } : undefined}
            />
          );
        })}
      </div>
      {complete && (
        <span className={styles.sparkle} aria-hidden="true">
          ✨
        </span>
      )}
    </button>
  );
}
