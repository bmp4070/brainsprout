import type { Cell } from '../lib/types';
import styles from './CrosswordGrid.module.css';

export interface CrosswordGridProps {
  grid: Cell[][];
  /** blankId -> locked-in value. */
  solved: Record<number, number>;
  activeBlankId: number | null;
  onSelectBlank: (blankId: number) => void;
}

/** Renders the 5x5 interlocking-equation grid; blank cells are tap targets. */
export default function CrosswordGrid({ grid, solved, activeBlankId, onSelectBlank }: CrosswordGridProps) {
  return (
    <div
      className={styles.grid}
      style={{ ['--cols' as string]: grid.length }}
      role="group"
      aria-label="Math crossword grid"
    >
      {grid.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r},${c}`;
          if (cell.kind === 'empty') {
            return <div key={key} className={styles.empty} aria-hidden="true" />;
          }
          if (cell.kind === 'op') {
            return (
              <div key={key} className={styles.op} aria-hidden="true">
                {cell.symbol}
              </div>
            );
          }
          // number cell
          if (cell.blankId === null) {
            return (
              <div key={key} className={styles.given} aria-label={`${cell.value}`}>
                {cell.value}
              </div>
            );
          }
          const isSolved = solved[cell.blankId] !== undefined;
          if (isSolved) {
            return (
              <div key={key} className={`${styles.num} ${styles.filled}`} aria-label={`${solved[cell.blankId]}`}>
                {solved[cell.blankId]}
              </div>
            );
          }
          const isActive = cell.blankId === activeBlankId;
          return (
            <button
              key={key}
              type="button"
              className={`${styles.num} ${styles.blank} ${isActive ? styles.active : ''}`}
              onClick={() => onSelectBlank(cell.blankId as number)}
              aria-label={isActive ? 'Missing number, selected' : 'Missing number, tap to fill'}
            >
              ?
            </button>
          );
        }),
      )}
    </div>
  );
}
