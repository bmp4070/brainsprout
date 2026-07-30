import type { Puzzle } from '../lib/types';
import SceneView from './SceneView';
import styles from './SpotBoard.module.css';

export interface SpotBoardProps {
  puzzle: Puzzle;
  palette: string[];
  skyColor: string;
  groundColor: string;
  found: string[];
  hint: string | null;
  lastMiss: { x: number; y: number } | null;
  missSeq: number;
  onTapScene: (x: number, y: number) => void;
}

/**
 * Lays out the two nearly-identical pictures: side by side on wide screens,
 * stacked on narrow/portrait ones. Both images share the same found/hint/miss
 * state, since a tap on either one tests the same set of differences.
 */
export default function SpotBoard({
  puzzle,
  palette,
  skyColor,
  groundColor,
  found,
  hint,
  lastMiss,
  missSeq,
  onTapScene,
}: SpotBoardProps) {
  return (
    <div className={styles.board}>
      <div className={styles.pane}>
        <SceneView
          scene={puzzle.left}
          palette={palette}
          skyColor={skyColor}
          groundColor={groundColor}
          differences={puzzle.differences}
          found={found}
          hint={hint}
          lastMiss={lastMiss}
          missSeq={missSeq}
          onTapScene={onTapScene}
          label="Picture A"
        />
      </div>
      <div className={styles.divider} aria-hidden="true">
        <span className={styles.dividerBadge}>VS</span>
      </div>
      <div className={styles.pane}>
        <SceneView
          scene={puzzle.right}
          palette={palette}
          skyColor={skyColor}
          groundColor={groundColor}
          differences={puzzle.differences}
          found={found}
          hint={hint}
          lastMiss={lastMiss}
          missSeq={missSeq}
          onTapScene={onTapScene}
          label="Picture B"
        />
      </div>
    </div>
  );
}
