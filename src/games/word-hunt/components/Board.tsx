import { useCallback, useRef, useState } from 'react';
import type { Cell } from '../lib/types';
import { adjacent, inBounds, sameCell } from '../lib/path';
import styles from './Board.module.css';

export interface BoardProps {
  grid: string[][];
  /** Cells to highlight as a hint (an unfound word's route), or null. */
  hintPath: Cell[] | null;
  /** Flash color feedback after a submit: true = found, false = rejected. */
  flash: 'good' | 'bad' | null;
  onSubmit: (path: Cell[]) => void;
}

function cellFromPoint(x: number, y: number, size: number): Cell | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const target = el.closest('[data-cell]') as HTMLElement | null;
  if (!target) return null;
  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
  const cell = { row, col };
  return inBounds(cell, size) ? cell : null;
}

/**
 * The letter grid. The player drags (mouse or touch) across touching letters to
 * trace a word; releasing submits it. The current trace snaps only to cells
 * adjacent to the last one and never revisits a cell, so the path is always a
 * legal Boggle route by construction.
 */
export default function Board({ grid, hintPath, flash, onSubmit }: BoardProps) {
  const size = grid.length;
  const [path, setPath] = useState<Cell[]>([]);
  const tracing = useRef(false);

  const pathKeys = new Set(path.map((c) => `${c.row},${c.col}`));
  const hintKeys = new Set((hintPath ?? []).map((c) => `${c.row},${c.col}`));
  const lastCell = path.length > 0 ? path[path.length - 1] : null;

  const extend = useCallback((cell: Cell) => {
    setPath((prev) => {
      if (prev.length === 0) return [cell];
      const last = prev[prev.length - 1];
      if (sameCell(last, cell)) return prev;
      // Stepping back onto the previous cell trims the trace (forgiving undo).
      if (prev.length >= 2 && sameCell(prev[prev.length - 2], cell)) {
        return prev.slice(0, -1);
      }
      if (prev.some((c) => sameCell(c, cell))) return prev; // no revisits
      if (!adjacent(last, cell)) return prev; // must touch
      return [...prev, cell];
    });
  }, []);

  const beginAt = useCallback((x: number, y: number) => {
    const cell = cellFromPoint(x, y, size);
    if (!cell) return;
    tracing.current = true;
    setPath([cell]);
  }, [size]);

  const moveTo = useCallback(
    (x: number, y: number) => {
      if (!tracing.current) return;
      const cell = cellFromPoint(x, y, size);
      if (cell) extend(cell);
    },
    [extend, size],
  );

  const end = useCallback(() => {
    if (!tracing.current) return;
    tracing.current = false;
    setPath((prev) => {
      if (prev.length >= 2) onSubmit(prev);
      return [];
    });
  }, [onSubmit]);

  return (
    <div
      className={`${styles.board} ${flash ? styles[flash] : ''}`}
      style={{ ['--cols' as string]: size }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        beginAt(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => moveTo(e.clientX, e.clientY)}
      onPointerUp={end}
      onPointerCancel={end}
      role="grid"
      aria-label="Letter grid — drag across touching letters to spell a word"
    >
      {grid.map((row, r) =>
        row.map((letter, c) => {
          const key = `${r},${c}`;
          const inPath = pathKeys.has(key);
          const isHint = hintKeys.has(key);
          const isLast = lastCell !== null && lastCell.row === r && lastCell.col === c;
          const className = [
            styles.cell,
            inPath ? styles.inPath : '',
            isLast ? styles.lastInPath : '',
            isHint ? styles.hint : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div
              key={key}
              data-cell=""
              data-row={r}
              data-col={c}
              className={className}
              role="gridcell"
              aria-label={letter}
            >
              {letter}
            </div>
          );
        }),
      )}
    </div>
  );
}
