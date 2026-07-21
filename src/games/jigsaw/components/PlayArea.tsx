import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PieceLayout } from '../lib/pieces';
import type { DifficultyConfig } from '../lib/types';
import type { PiecePosition } from '../hooks/useJigsaw';
import { getOuterExtentFrac, getPlayRect, getTrayRect, trayModeForWidth } from '../lib/trayLayout';
import type { TrayMode } from '../lib/trayLayout';
import PieceView from './PieceView';
import styles from './PlayArea.module.css';

export interface PlayAreaProps {
  layout: PieceLayout;
  difficulty: DifficultyConfig;
  positions: PiecePosition[][];
  dragging: { row: number; col: number } | null;
  backgroundUri: string;
  showGhost: boolean;
  /** Which tray layout the current piece positions were scattered/remapped for. */
  trayMode: TrayMode;
  /** Called when the measured container size crosses the side/below breakpoint,
   * so the caller can dispatch a RELAYOUT and keep piece positions in sync. */
  onTrayModeChange: (trayMode: TrayMode) => void;
  onPickUp: (row: number, col: number) => void;
  onMove: (row: number, col: number, xFrac: number, yFrac: number) => void;
  onDrop: (row: number, col: number, xFrac: number, yFrac: number, snapped: boolean) => void;
}

const TAB_RATIO = 0.22;
const BOARD_ASPECT = 4 / 3;
const BOARD_MAX_WIDTH = 640;
const BOARD_WIDTH_CONTAINER_FRAC = 0.92;
const BOARD_HEIGHT_VIEWPORT_FRAC = 0.55;
// Cosmetic margin (fraction of board width/height) the tray's visible box
// extends beyond the region pieces actually scatter into.
const TRAY_PAD_X = 0.02;
const TRAY_PAD_Y = 0.04;

export default function PlayArea({
  layout,
  difficulty,
  positions,
  dragging,
  backgroundUri,
  showGhost,
  trayMode,
  onTrayModeChange,
  onPickUp,
  onMove,
  onDrop,
}: PlayAreaProps) {
  const measureRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [viewportH, setViewportH] = useState(() => (typeof window === 'undefined' ? 0 : window.innerHeight));

  // Measures the full-bleed space available to the play area (unaffected by
  // the board/tray's own sizing), which decides whether the tray sits below
  // the board or beside it.
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => setContainerW(el.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Viewport height matters too (a rotation can change it without changing
  // width), and it isn't observed by the ResizeObserver above.
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  useEffect(() => {
    if (containerW <= 0) return;
    const measuredMode = trayModeForWidth(containerW);
    if (measuredMode !== trayMode) {
      onTrayModeChange(measuredMode);
    }
  }, [containerW, trayMode, onTrayModeChange]);

  const boardW =
    containerW > 0 && viewportH > 0
      ? Math.min(
          containerW * BOARD_WIDTH_CONTAINER_FRAC,
          BOARD_MAX_WIDTH,
          viewportH * BOARD_HEIGHT_VIEWPORT_FRAC * BOARD_ASPECT,
        )
      : 0;
  const boardH = boardW / BOARD_ASPECT;
  const cellW = boardW / difficulty.cols;
  const cellH = boardH / difficulty.rows;
  const tabSize = TAB_RATIO * Math.min(cellW, cellH);
  const showGridlines = difficulty.id === 'easy';

  const trayRect = getTrayRect(trayMode);
  const playRect = getPlayRect(trayMode);
  const outerExtent = getOuterExtentFrac(trayMode);
  const outerWidth = boardW * outerExtent.width;
  const outerHeight = boardH * outerExtent.height;

  const trayLeft = (trayRect.x0 - TRAY_PAD_X) * boardW;
  const trayTop = (trayRect.y0 - TRAY_PAD_Y) * boardH;
  const trayWidth = (trayRect.x1 - trayRect.x0 + 2 * TRAY_PAD_X) * boardW;
  const trayHeight = (trayRect.y1 - trayRect.y0 + 2 * TRAY_PAD_Y) * boardH;

  const pieces = layout.pieces.flat();

  return (
    <div ref={measureRef} className={styles.measure}>
      <div
        ref={boxRef}
        className={styles.outer}
        style={{ width: boardW > 0 ? outerWidth : undefined, height: boardW > 0 ? outerHeight : undefined }}
      >
        <div className={styles.board} style={{ width: boardW || undefined, height: boardH || undefined }}>
          {showGhost && (
            <div
              className={styles.ghost}
              style={{ backgroundImage: `url("${backgroundUri}")` }}
            />
          )}
          {showGridlines && boardW > 0 && (
            <svg className={styles.gridlines} width={boardW} height={boardH}>
              {Array.from({ length: difficulty.cols - 1 }, (_, i) => (i + 1) * cellW).map((x) => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={boardH} stroke="#2c2340" strokeOpacity={0.15} />
              ))}
              {Array.from({ length: difficulty.rows - 1 }, (_, i) => (i + 1) * cellH).map((y) => (
                <line key={`h${y}`} x1={0} y1={y} x2={boardW} y2={y} stroke="#2c2340" strokeOpacity={0.15} />
              ))}
            </svg>
          )}
        </div>
        {boardW > 0 && (
          <div
            className={styles.tray}
            style={{
              position: 'absolute',
              left: trayLeft,
              top: trayTop,
              width: trayWidth,
              height: trayHeight,
            }}
          />
        )}
        {boardW > 0 &&
          pieces.map((piece) => {
            const pos = positions[piece.row][piece.col];
            const isDragging = dragging?.row === piece.row && dragging?.col === piece.col;
            return (
              <PieceView
                key={`${piece.row}-${piece.col}`}
                piece={piece}
                xFrac={pos.xFrac}
                yFrac={pos.yFrac}
                rotation={pos.rotation}
                locked={pos.locked}
                isDragging={isDragging}
                zIndex={pos.locked ? 1 : isDragging ? 100000 : 100 + pos.zOrder}
                boardW={boardW}
                boardH={boardH}
                cellW={cellW}
                cellH={cellH}
                tabSize={tabSize}
                cols={difficulty.cols}
                rows={difficulty.rows}
                backgroundUri={backgroundUri}
                playRect={playRect}
                containerRef={boxRef}
                onPickUp={onPickUp}
                onMove={onMove}
                onDrop={onDrop}
              />
            );
          })}
      </div>
    </div>
  );
}
