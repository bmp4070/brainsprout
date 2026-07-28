import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Cell } from '../lib/types';
import { blockColorHex, blockColorName } from '../palette';
import { ensureAudioReady, playTick } from '../../../shared/audio/sounds';
import styles from './TrayPiece.module.css';

/** Pixel size of one block cell inside a tray thumbnail. */
const CELL_PX = 18;

export interface TrayPieceProps {
  pieceId: number;
  colorIndex: number;
  /** This piece's current silhouette (normalized), from orientedCells(trayPiece). */
  cells: Cell[];
  selected: boolean;
  isDragging: boolean;
  disabled: boolean;
  onSelect: (pieceId: number) => void;
  onDragStart: (pieceId: number, clientX: number, clientY: number) => void;
  onDragMove: (pieceId: number, clientX: number, clientY: number) => void;
  onDragEnd: (pieceId: number, clientX: number, clientY: number) => void;
}

export default function TrayPiece({
  pieceId,
  colorIndex,
  cells,
  selected,
  isDragging,
  disabled,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}: TrayPieceProps) {
  const draggingRef = useRef(false);

  let maxR = 0;
  let maxC = 0;
  for (const cell of cells) {
    if (cell.r > maxR) maxR = cell.r;
    if (cell.c > maxC) maxC = cell.c;
  }
  const gridRows = maxR + 1;
  const gridCols = maxC + 1;
  const filled = new Set(cells.map((cell) => `${cell.r},${cell.c}`));

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    ensureAudioReady();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some environments (e.g. jsdom) don't implement pointer capture.
    }
    draggingRef.current = true;
    playTick(0);
    onSelect(pieceId);
    onDragStart(pieceId, event.clientX, event.clientY);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    onDragMove(pieceId, event.clientX, event.clientY);
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    onDragEnd(pieceId, event.clientX, event.clientY);
  };

  const classNames = [styles.button];
  if (selected) classNames.push(styles.selected);
  if (isDragging) classNames.push(styles.dragging);

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${blockColorName(colorIndex)} block piece${selected ? ', selected' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, ${CELL_PX}px)`,
          gridTemplateRows: `repeat(${gridRows}, ${CELL_PX}px)`,
        }}
      >
        {Array.from({ length: gridRows * gridCols }, (_, i) => {
          const r = Math.floor(i / gridCols);
          const c = i % gridCols;
          const isBlock = filled.has(`${r},${c}`);
          return (
            <div
              key={i}
              className={isBlock ? styles.block : undefined}
              style={{ background: isBlock ? blockColorHex(colorIndex) : 'transparent' }}
            />
          );
        })}
      </div>
    </button>
  );
}
