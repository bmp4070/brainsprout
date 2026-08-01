import { ITEM_BY_ID } from '../lib/items';
import styles from './ItemTile.module.css';

export interface ItemTileProps {
  itemId: string;
  /** 'found' greys/checks a caught target; 'wrong' shakes; otherwise normal. */
  state?: 'default' | 'found' | 'wrong';
  onTap?: (itemId: string) => void;
}

/** One emoji-on-a-tile — the single visual unit shared by the study grid and belt. */
export default function ItemTile({ itemId, state = 'default', onTap }: ItemTileProps) {
  const item = ITEM_BY_ID[itemId];
  const emoji = item?.emoji ?? '❓';
  const name = item?.name ?? 'mystery item';
  const className = [
    styles.tile,
    state === 'found' ? styles.found : '',
    state === 'wrong' ? styles.wrong : '',
    onTap ? styles.tappable : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (onTap) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => onTap(itemId)}
        aria-label={name}
        aria-pressed={state === 'found'}
      >
        <span className={styles.emoji} aria-hidden="true">
          {emoji}
        </span>
        {state === 'found' && <span className={styles.check} aria-hidden="true">✓</span>}
      </button>
    );
  }

  return (
    <div className={className} role="img" aria-label={name}>
      <span className={styles.emoji} aria-hidden="true">
        {emoji}
      </span>
    </div>
  );
}
