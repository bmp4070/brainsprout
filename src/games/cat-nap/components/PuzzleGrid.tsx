import { useMemo } from 'react';
import type { Puzzle, CellMark } from '../lib/types';
import { cellKey } from '../lib/types';
import PuzzleCell from './PuzzleCell';
import type { BorderWeight, CellBorders } from './PuzzleCell';
import styles from './PuzzleGrid.module.css';

export interface PuzzleGridProps {
  puzzle: Puzzle;
  marks: CellMark[][];
  conflicts: ReadonlySet<string>;
  disabled: boolean;
  onCellClick: (row: number, col: number) => void;
}

const REGION_COLOR_COUNT = 6;

function regionColor(regionId: number): string {
  return `var(--word-color-${regionId % REGION_COLOR_COUNT})`;
}

function weightFor(a: number, b: number | undefined): BorderWeight {
  if (b === undefined || a !== b) return 'thick';
  return 'thin';
}

export default function PuzzleGrid({
  puzzle,
  marks,
  conflicts,
  disabled,
  onCellClick,
}: PuzzleGridProps) {
  const { size, regions } = puzzle;

  const borders = useMemo<CellBorders[][]>(() => {
    const result: CellBorders[][] = [];
    for (let row = 0; row < size; row++) {
      const rowBorders: CellBorders[] = [];
      for (let col = 0; col < size; col++) {
        const region = regions[row][col];
        rowBorders.push({
          top: weightFor(region, row > 0 ? regions[row - 1][col] : undefined),
          left: weightFor(region, col > 0 ? regions[row][col - 1] : undefined),
          right: weightFor(region, col < size - 1 ? regions[row][col + 1] : undefined),
          bottom: weightFor(region, row < size - 1 ? regions[row + 1][col] : undefined),
        });
      }
      result.push(rowBorders);
    }
    return result;
  }, [regions, size]);

  return (
    <div className={styles.frame}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {regions.map((rowRegions, row) =>
          rowRegions.map((regionId, col) => {
            const key = cellKey({ row, col });
            return (
              <PuzzleCell
                key={key}
                row={row}
                col={col}
                mark={marks[row][col]}
                regionId={regionId}
                regionColor={regionColor(regionId)}
                borders={borders[row][col]}
                conflict={conflicts.has(key)}
                disabled={disabled}
                onClick={onCellClick}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}
