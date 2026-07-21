import { useMemo, useRef } from 'react';
import type { CellPos, Puzzle } from '../lib/types';
import type { FoundWord } from '../hooks/useWordSearch';
import { cellKey, snapLine } from '../lib/selection';
import { useDragSelection } from '../hooks/useDragSelection';
import Cell from './Cell';
import SelectionOverlay from './SelectionOverlay';
import styles from './Grid.module.css';

export interface GridProps {
  puzzle: Puzzle;
  selection: { anchor: CellPos; current: CellPos } | null;
  found: FoundWord[];
  hintCell: CellPos | null;
  enabled: boolean;
  onSelectStart: (cell: CellPos) => void;
  onSelectMove: (cell: CellPos) => void;
  onSelectEnd: () => void;
}

export default function Grid({
  puzzle,
  selection,
  found,
  hintCell,
  enabled,
  onSelectStart,
  onSelectMove,
  onSelectEnd,
}: GridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const activeCells = useMemo(() => {
    if (!selection) return null;
    return snapLine(selection.anchor, selection.current, puzzle.size);
  }, [selection, puzzle.size]);

  const selectedKeys = useMemo(
    () => new Set((activeCells ?? []).map(cellKey)),
    [activeCells],
  );

  const foundColorByCell = useMemo(() => {
    const map = new Map<string, number>();
    for (const word of found) {
      for (const cell of word.cells) {
        map.set(cellKey(cell), word.colorIndex);
      }
    }
    return map;
  }, [found]);

  const hintKey = hintCell ? cellKey(hintCell) : null;

  const dragHandlers = useDragSelection({
    gridRef,
    size: puzzle.size,
    enabled,
    onStart: onSelectStart,
    onMove: onSelectMove,
    onEnd: onSelectEnd,
  });

  return (
    <div className={styles.frame}>
      <div
        ref={gridRef}
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}
        {...dragHandlers}
      >
      {puzzle.grid.map((rowLetters, row) =>
        rowLetters.map((letter, col) => {
          const key = cellKey({ row, col });
          return (
            <Cell
              key={key}
              letter={letter}
              selected={selectedKeys.has(key)}
              colorIndex={foundColorByCell.get(key) ?? null}
              hint={hintKey === key}
            />
          );
        }),
      )}
        <SelectionOverlay size={puzzle.size} activeCells={activeCells} found={found} />
      </div>
    </div>
  );
}
