import { useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { DIR_BIT } from '../lib/types';
import type { Cell, Direction, Maze } from '../lib/types';
import styles from './MazeBoard.module.css';

export interface MazeBoardProps {
  maze: Maze;
  pos: Cell;
  visited: string[];
  hint: Cell | null;
  character: string;
  goal: string;
  onMove: (dir: Direction) => void;
}

/** Minimum drag distance (in screen px) before a swipe counts as a move. */
const SWIPE_THRESHOLD = 24;

/** Builds one combined SVG path `d` string for every closed (walled) cell side. */
function buildWallsPath(maze: Maze): string {
  const segments: string[] = [];
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      const bits = maze.open[r][c];
      if (!(bits & DIR_BIT.up)) segments.push(`M${c},${r} L${c + 1},${r}`);
      if (!(bits & DIR_BIT.left)) segments.push(`M${c},${r} L${c},${r + 1}`);
      if (!(bits & DIR_BIT.down)) segments.push(`M${c},${r + 1} L${c + 1},${r + 1}`);
      if (!(bits & DIR_BIT.right)) segments.push(`M${c + 1},${r} L${c + 1},${r + 1}`);
    }
  }
  return segments.join(' ');
}

function parseCellKey(key: string): Cell {
  const [r, c] = key.split(',').map(Number);
  return { r, c };
}

export default function MazeBoard({
  maze,
  pos,
  visited,
  hint,
  character,
  goal,
  onMove,
}: MazeBoardProps) {
  const wallsPath = useMemo(() => buildWallsPath(maze), [maze]);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    const start = startRef.current;
    startRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
    const dir: Direction =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    onMove(dir);
  };

  const handlePointerCancel = () => {
    startRef.current = null;
  };

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${maze.cols} ${maze.rows}`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        role="img"
        aria-label="Maze board"
      >
        <g aria-hidden="true">
          {visited.map((key) => {
            const cell = parseCellKey(key);
            return (
              <circle
                key={key}
                className={styles.trailDot}
                cx={cell.c + 0.5}
                cy={cell.r + 0.5}
                r={0.14}
              />
            );
          })}
        </g>
        {hint && (
          <rect
            className={styles.hintCell}
            x={hint.c + 0.12}
            y={hint.r + 0.12}
            width={0.76}
            height={0.76}
            rx={0.16}
            aria-hidden="true"
          />
        )}
        <text
          className={styles.goalEmoji}
          x={maze.goal.c + 0.5}
          y={maze.goal.r + 0.52}
          fontSize={0.62}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {goal}
        </text>
        <path className={styles.wallPath} d={wallsPath} vectorEffect="non-scaling-stroke" />
        <text
          className={styles.character}
          x={pos.c + 0.5}
          y={pos.r + 0.52}
          fontSize={0.62}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {character}
        </text>
      </svg>
    </div>
  );
}
