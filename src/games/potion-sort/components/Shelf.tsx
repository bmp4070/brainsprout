import type { BoardState, Bottle } from '../lib/types';
import { CAPACITY } from '../lib/types';
import { topRunLength } from '../lib/rules';
import PotionBottle from './PotionBottle';
import styles from './Shelf.module.css';

export interface ShelfProps {
  board: BoardState;
  selected: number | null;
  hint: { from: number; to: number } | null;
  disabled: boolean;
  onTapBottle: (index: number) => void;
}

function isComplete(bottle: Bottle): boolean {
  return bottle.length === CAPACITY && bottle.every((c) => c === bottle[0]);
}

export default function Shelf({ board, selected, hint, disabled, onTapBottle }: ShelfProps) {
  return (
    <div className={styles.row}>
      {board.map((bottle, index) => (
        <div key={index} className={styles.slot}>
          <PotionBottle
            bottle={bottle}
            index={index}
            selected={selected === index}
            liftedCount={selected === index ? topRunLength(bottle) : 0}
            complete={isComplete(bottle)}
            hinted={hint ? (hint.from === index ? 'from' : hint.to === index ? 'to' : null) : null}
            onTap={onTapBottle}
            disabled={disabled}
          />
        </div>
      ))}
    </div>
  );
}
