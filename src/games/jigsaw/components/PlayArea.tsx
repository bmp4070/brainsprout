import { useLayoutEffect, useRef, useState } from 'react';
import type { PieceLayout } from '../lib/pieces';
import type { DifficultyConfig } from '../lib/types';
import type { PiecePosition } from '../hooks/useJigsaw';
import { TRAY_BOTTOM_FRAC, TRAY_TOP_FRAC } from '../lib/trayLayout';
import PieceView from './PieceView';
import styles from './PlayArea.module.css';

export interface PlayAreaProps {
  layout: PieceLayout;
  difficulty: DifficultyConfig;
  positions: PiecePosition[][];
  dragging: { row: number; col: number } | null;
  backgroundUri: string;
  showGhost: boolean;
  onPickUp: (row: number, col: number) => void;
  onMove: (row: number, col: number, xFrac: number, yFrac: number) => void;
  onDrop: (row: number, col: number, xFrac: number, yFrac: number, snapped: boolean) => void;
}

const TAB_RATIO = 0.22;

export default function PlayArea({
  layout,
  difficulty,
  positions,
  dragging,
  backgroundUri,
  showGhost,
  onPickUp,
  onMove,
  onDrop,
}: PlayAreaProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [boardW, setBoardW] = useState(0);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const measure = () => setBoardW(el.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const boardH = (boardW * 3) / 4;
  const cellW = boardW / difficulty.cols;
  const cellH = boardH / difficulty.rows;
  const tabSize = TAB_RATIO * Math.min(cellW, cellH);
  const outerHeight = boardH * TRAY_BOTTOM_FRAC;
  const showGridlines = difficulty.id === 'easy';

  const pieces = layout.pieces.flat();

  return (
    <div
      ref={outerRef}
      className={styles.outer}
      style={{ height: boardW > 0 ? outerHeight : undefined }}
    >
      <div className={styles.board} style={{ height: boardH || undefined }}>
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
      <div
        className={styles.tray}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: TRAY_TOP_FRAC * boardH - 0.06 * boardH,
          height: (TRAY_BOTTOM_FRAC - TRAY_TOP_FRAC + 0.06) * boardH,
        }}
      />
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
              zIndex={pos.locked ? 1 : isDragging ? 100 : 10}
              boardW={boardW}
              boardH={boardH}
              cellW={cellW}
              cellH={cellH}
              tabSize={tabSize}
              cols={difficulty.cols}
              rows={difficulty.rows}
              backgroundUri={backgroundUri}
              containerRef={outerRef}
              onPickUp={onPickUp}
              onMove={onMove}
              onDrop={onDrop}
            />
          );
        })}
    </div>
  );
}
