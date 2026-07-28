import { forwardRef, useMemo } from 'react';
import type { Cell, Placement, Puzzle } from '../lib/types';
import { cellKey } from '../lib/types';
import { blockColorHex, blockColorName } from '../palette';
import styles from './Board.module.css';

export interface BoardPreview {
  cells: Cell[];
  valid: boolean;
}

export interface BoardProps {
  puzzle: Puzzle;
  /** cellKey -> pieceId for every currently-placed cell. */
  occupied: Record<string, number>;
  hint: Placement | null;
  /** Live drag preview (ghost snapped to grid), or null when not dragging. */
  preview: BoardPreview | null;
  disabled: boolean;
  onPickup: (pieceId: number) => void;
}

/**
 * The shaped outline the kid fills in. Forwards its root ref so the game
 * screen can read getBoundingClientRect() to convert drag pointer positions
 * into board cell coordinates.
 */
const Board = forwardRef<HTMLDivElement, BoardProps>(function Board(
  { puzzle, occupied, hint, preview, disabled, onPickup },
  ref,
) {
  const { rows, cols, region, pieces } = puzzle;

  const colorByPieceId = useMemo(() => {
    const map = new Map<number, number>();
    for (const piece of pieces) map.set(piece.id, piece.colorIndex);
    return map;
  }, [pieces]);

  const hintKeys = useMemo(() => {
    if (!hint) return null;
    return new Set(hint.cells.map(cellKey));
  }, [hint]);

  const previewMap = useMemo(() => {
    if (!preview) return null;
    const map = new Map<string, boolean>();
    for (const cell of preview.cells) map.set(cellKey(cell), preview.valid);
    return map;
  }, [preview]);

  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      cells.push({ r, c });
    }
  }

  return (
    <div
      ref={ref}
      className={styles.board}
      style={
        {
          '--board-aspect': cols / rows,
          '--cols': cols,
          '--rows': rows,
        } as React.CSSProperties
      }
      role="grid"
      aria-label="Shape outline"
    >
      {cells.map(({ r, c }) => {
        const key = cellKey({ r, c });
        if (!region[r]?.[c]) {
          return <div key={key} className={`${styles.cell} ${styles.outside}`} aria-hidden="true" />;
        }
        const pieceId = occupied[key];
        const isFilled = pieceId !== undefined;
        const colorIndex = isFilled ? colorByPieceId.get(pieceId) ?? 0 : -1;
        const isHinted = hintKeys?.has(key) ?? false;
        const previewValid = previewMap?.get(key);

        const classNames = [styles.cell, isFilled ? styles.filled : styles.slot];
        if (isHinted) classNames.push(styles.hint);
        if (previewValid === true) classNames.push(styles.previewValid);
        if (previewValid === false) classNames.push(styles.previewInvalid);

        if (!isFilled) {
          return (
            <div key={key} className={classNames.join(' ')} data-cell={key}>
              {/* empty slot, waiting for a piece */}
            </div>
          );
        }

        return (
          <button
            key={key}
            type="button"
            className={classNames.join(' ')}
            style={{ background: blockColorHex(colorIndex) }}
            data-cell={key}
            disabled={disabled}
            aria-label={`${blockColorName(colorIndex)} block, tap to pick up`}
            onClick={() => onPickup(pieceId)}
          />
        );
      })}
    </div>
  );
});

export default Board;
