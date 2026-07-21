import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { buildPiecePath } from '../lib/pieces';
import type { FracRect } from '../lib/trayLayout';
import type { PieceDef } from '../lib/pieces';
import { ensureAudioReady, playFound, playTick } from '../../../shared/audio/sounds';
import styles from './PieceView.module.css';

export interface PieceViewProps {
  piece: PieceDef;
  xFrac: number;
  yFrac: number;
  rotation: number;
  locked: boolean;
  isDragging: boolean;
  zIndex: number;
  boardW: number;
  boardH: number;
  cellW: number;
  cellH: number;
  tabSize: number;
  cols: number;
  rows: number;
  backgroundUri: string;
  /** The current layout's valid drop region (board ∪ tray), in board-fraction space. */
  playRect: FracRect;
  containerRef: RefObject<HTMLElement | null>;
  onPickUp: (row: number, col: number) => void;
  onMove: (row: number, col: number, xFrac: number, yFrac: number) => void;
  onDrop: (row: number, col: number, xFrac: number, yFrac: number, snapped: boolean) => void;
}

const SNAP_FRACTION = 0.35;

export default function PieceView({
  piece,
  xFrac,
  yFrac,
  rotation,
  locked,
  isDragging,
  zIndex,
  boardW,
  boardH,
  cellW,
  cellH,
  tabSize,
  cols,
  rows,
  backgroundUri,
  playRect,
  containerRef,
  onPickUp,
  onMove,
  onDrop,
}: PieceViewProps) {
  const { row, col } = piece;
  const draggingRef = useRef(false);
  const grabOffsetRef = useRef({ dx: 0, dy: 0 });
  const lastFracRef = useRef({ xFrac, yFrac });
  lastFracRef.current = { xFrac, yFrac };

  const width = cellW + 2 * tabSize;
  const height = cellH + 2 * tabSize;
  const left = xFrac * boardW - tabSize;
  const top = yFrac * boardH - tabSize;
  const path = buildPiecePath(piece, cellW, cellH, tabSize);

  const posFromEvent = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): { xFrac: number; yFrac: number } | null => {
    const container = containerRef.current;
    if (!container || boardW <= 0 || boardH <= 0) return null;
    const rect = container.getBoundingClientRect();
    const leftPx = event.clientX - rect.left - grabOffsetRef.current.dx;
    const topPx = event.clientY - rect.top - grabOffsetRef.current.dy;
    return {
      xFrac: (leftPx + tabSize) / boardW,
      yFrac: (topPx + tabSize) / boardH,
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (locked) return;
    const container = containerRef.current;
    if (!container) return;
    ensureAudioReady();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some environments (e.g. jsdom) don't implement pointer capture.
    }
    const rect = container.getBoundingClientRect();
    grabOffsetRef.current = {
      dx: event.clientX - rect.left - left,
      dy: event.clientY - rect.top - top,
    };
    draggingRef.current = true;
    playTick(1);
    onPickUp(row, col);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const next = posFromEvent(event);
    if (!next) return;
    lastFracRef.current = next;
    onMove(row, col, next.xFrac, next.yFrac);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const next = posFromEvent(event) ?? lastFracRef.current;
    const targetXFrac = col / cols;
    const targetYFrac = row / rows;
    const dxPx = (next.xFrac - targetXFrac) * boardW;
    const dyPx = (next.yFrac - targetYFrac) * boardH;
    const dist = Math.hypot(dxPx, dyPx);
    const snapped = dist <= SNAP_FRACTION * Math.min(cellW, cellH);
    if (snapped) {
      playFound();
    }
    // Keep unsnapped drops inside the board + tray area so a flung piece
    // can't land over the HUD or off-page where it's hard to grab back.
    const minX = playRect.x0;
    const maxX = playRect.x1 - cellW / boardW;
    const minY = playRect.y0;
    const maxY = playRect.y1 - cellH / boardH;
    const xFrac = Math.min(Math.max(next.xFrac, minX), maxX);
    const yFrac = Math.min(Math.max(next.yFrac, minY), maxY);
    onDrop(row, col, xFrac, yFrac, snapped);
  };

  return (
    <div
      className={`${styles.piece} ${locked ? styles.locked : ''}`}
      style={{
        width,
        height,
        transform: `translate(${left}px, ${top}px) rotate(${isDragging ? 0 : rotation}deg)`,
        zIndex,
        backgroundImage: `url("${backgroundUri}")`,
        backgroundSize: `${boardW}px ${boardH}px`,
        backgroundPosition: `${-(col * cellW - tabSize)}px ${-(row * cellH - tabSize)}px`,
        clipPath: `path('${path}')`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <svg className={styles.outline} width={width} height={height} aria-hidden="true">
        <path d={path} fill="none" stroke="rgba(44,35,64,0.35)" strokeWidth={1.5} />
      </svg>
    </div>
  );
}
