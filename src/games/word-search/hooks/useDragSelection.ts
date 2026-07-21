import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import type { CellPos } from '../lib/types';

export interface UseDragSelectionOptions {
  /** Ref to the grid container the pointer coordinates are measured against. */
  gridRef: RefObject<HTMLElement | null>;
  /** Number of cells per side (grid is always square). */
  size: number;
  /** When false, pointer events are ignored entirely. */
  enabled: boolean;
  onStart: (cell: CellPos) => void;
  onMove: (cell: CellPos) => void;
  onEnd: () => void;
}

export interface DragSelectionHandlers {
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * Translates pointer drag gestures over a square grid container into
 * cell-based selection callbacks. Uses Pointer Events + setPointerCapture so
 * a single finger/mouse drag keeps reporting moves even if it leaves the
 * element's bounding box.
 */
export function useDragSelection({
  gridRef,
  size,
  enabled,
  onStart,
  onMove,
  onEnd,
}: UseDragSelectionOptions): DragSelectionHandlers {
  const draggingRef = useRef(false);
  const lastCellRef = useRef<CellPos | null>(null);

  const cellFromPoint = useCallback(
    (clientX: number, clientY: number): CellPos | null => {
      const el = gridRef.current;
      if (!el || size <= 0) return null;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const colRaw = Math.floor(((clientX - rect.left) / rect.width) * size);
      const rowRaw = Math.floor(((clientY - rect.top) / rect.height) * size);
      const col = Math.min(size - 1, Math.max(0, colRaw));
      const row = Math.min(size - 1, Math.max(0, rowRaw));
      return { row, col };
    },
    [gridRef, size],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const cell = cellFromPoint(event.clientX, event.clientY);
      if (!cell) return;
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Some environments (e.g. jsdom) don't implement pointer capture.
      }
      draggingRef.current = true;
      lastCellRef.current = cell;
      onStart(cell);
    },
    [enabled, cellFromPoint, onStart],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!draggingRef.current) return;
      const cell = cellFromPoint(event.clientX, event.clientY);
      if (!cell) return;
      const last = lastCellRef.current;
      if (last && last.row === cell.row && last.col === cell.col) return;
      lastCellRef.current = cell;
      onMove(cell);
    },
    [cellFromPoint, onMove],
  );

  const endDrag = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    lastCellRef.current = null;
    onEnd();
  }, [onEnd]);

  const handlePointerUp = useCallback(
    (_event: ReactPointerEvent<HTMLElement>) => {
      endDrag();
    },
    [endDrag],
  );

  const handlePointerCancel = useCallback(
    (_event: ReactPointerEvent<HTMLElement>) => {
      endDrag();
    },
    [endDrag],
  );

  useEffect(() => {
    if (!enabled) {
      draggingRef.current = false;
      lastCellRef.current = null;
    }
  }, [enabled]);

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
  };
}
