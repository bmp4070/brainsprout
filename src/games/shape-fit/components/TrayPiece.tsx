import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Tri } from '../lib/types';
import { triPolygon } from '../lib/tri';
import { blockColorHex, blockColorName } from '../palette';
import { ensureAudioReady, playTick } from '../../../shared/audio/sounds';
import styles from './TrayPiece.module.css';

/** Pixel size of one grid cell inside a tray thumbnail. */
const CELL_PX = 28;

export interface TrayPieceProps {
  pieceId: number;
  colorIndex: number;
  /** This piece's current silhouette (normalized), from orientedTris(trayPiece). */
  tris: Tri[];
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
  tris,
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
  for (const t of tris) {
    if (t.r > maxR) maxR = t.r;
    if (t.c > maxC) maxC = t.c;
  }
  const gridRows = maxR + 1;
  const gridCols = maxC + 1;

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
      aria-label={`${blockColorName(colorIndex)} piece${selected ? ', selected' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <svg
        viewBox={`0 0 ${gridCols} ${gridRows}`}
        width={gridCols * CELL_PX}
        height={gridRows * CELL_PX}
        className={styles.svg}
        aria-hidden="true"
      >
        {tris.map((t, i) => (
          <polygon
            key={i}
            points={triPolygon(t)
              .map(([x, y]) => `${x},${y}`)
              .join(' ')}
            style={{ fill: blockColorHex(colorIndex) }}
            className={styles.triFill}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </button>
  );
}
