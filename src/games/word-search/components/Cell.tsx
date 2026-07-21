import { memo } from 'react';
import styles from './Cell.module.css';

export interface CellProps {
  letter: string;
  selected: boolean;
  /** Color index (0-5) of the found word this cell belongs to, or null. */
  colorIndex: number | null;
  hint: boolean;
}

function CellImpl({ letter, selected, colorIndex, hint }: CellProps) {
  const classNames = [styles.cell];
  if (selected) classNames.push(styles.selected);
  if (colorIndex !== null) classNames.push(styles.found);
  if (hint) classNames.push(styles.hint);

  const style =
    colorIndex !== null
      ? { background: `var(--word-color-${colorIndex})` }
      : undefined;

  return (
    <div className={classNames.join(' ')} style={style}>
      {letter}
    </div>
  );
}

export default memo(CellImpl);
