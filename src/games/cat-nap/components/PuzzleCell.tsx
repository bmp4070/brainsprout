import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { CellMark } from '../lib/types';
import CatSprite from './CatSprite';
import styles from './PuzzleCell.module.css';

export type BorderWeight = 'thick' | 'thin';

export interface CellBorders {
  top: BorderWeight;
  right: BorderWeight;
  bottom: BorderWeight;
  left: BorderWeight;
}

export interface PuzzleCellProps {
  row: number;
  col: number;
  mark: CellMark;
  regionId: number;
  regionColor: string;
  borders: CellBorders;
  conflict: boolean;
  disabled: boolean;
  onClick: (row: number, col: number) => void;
}

function borderWidth(weight: BorderWeight): string {
  return weight === 'thick' ? '3px' : '1px';
}

function PuzzleCellImpl({
  row,
  col,
  mark,
  regionId,
  regionColor,
  borders,
  conflict,
  disabled,
  onClick,
}: PuzzleCellProps) {
  const classNames = [styles.cell];
  if (mark === 'paw') classNames.push(styles.paw);
  if (conflict) classNames.push(styles.conflict);

  const style: CSSProperties = {
    background: regionColor,
    borderTopWidth: borderWidth(borders.top),
    borderRightWidth: borderWidth(borders.right),
    borderBottomWidth: borderWidth(borders.bottom),
    borderLeftWidth: borderWidth(borders.left),
  };

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      style={style}
      disabled={disabled}
      onClick={() => onClick(row, col)}
      aria-label={`Row ${row + 1}, column ${col + 1}${mark === 'cat' ? ', cat napping' : mark === 'paw' ? ', paw print note' : ', empty'}`}
    >
      {mark === 'cat' ? (
        <CatSprite variant={regionId} size="70%" className={styles.catSprite} />
      ) : mark === 'paw' ? (
        '🐾'
      ) : (
        ''
      )}
    </button>
  );
}

export default memo(PuzzleCellImpl);
