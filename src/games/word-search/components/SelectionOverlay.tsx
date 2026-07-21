import type { CellPos } from '../lib/types';
import type { FoundWord } from '../hooks/useWordSearch';
import styles from './SelectionOverlay.module.css';

export interface SelectionOverlayProps {
  size: number;
  /** Snapped cell path of the in-progress selection, or null when idle. */
  activeCells: CellPos[] | null;
  found: FoundWord[];
}

const STROKE_WIDTH = 0.62;

function center(cell: CellPos): { x: number; y: number } {
  return { x: cell.col + 0.5, y: cell.row + 0.5 };
}

export default function SelectionOverlay({
  size,
  activeCells,
  found,
}: SelectionOverlayProps) {
  return (
    <svg
      className={styles.overlay}
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {found.map((word) => {
        if (word.cells.length === 0) return null;
        const start = center(word.cells[0]);
        const end = center(word.cells[word.cells.length - 1]);
        return (
          <line
            key={word.word}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke={`var(--word-color-${word.colorIndex})`}
            strokeOpacity={0.35}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />
        );
      })}
      {activeCells && activeCells.length > 0 && (
        <line
          x1={center(activeCells[0]).x}
          y1={center(activeCells[0]).y}
          x2={center(activeCells[activeCells.length - 1]).x}
          y2={center(activeCells[activeCells.length - 1]).y}
          stroke="var(--color-primary)"
          strokeOpacity={0.45}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
