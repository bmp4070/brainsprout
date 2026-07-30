import { mulberry32 } from '../../../shared/lib/rng';
import {
  DIRECTIONS,
  DIR_BIT,
  DIR_DELTA,
  opposite,
  type Cell,
  type DifficultyConfig,
  type Direction,
  type Maze,
} from './types';

/** True if (r, c) is inside a `rows` x `cols` grid. */
function inBounds(rows: number, cols: number, r: number, c: number): boolean {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

/**
 * Generates a perfect maze via the recursive-backtracker (randomized DFS carve).
 *
 * Carving starts at {0,0} and visits every cell exactly once; when carving
 * between two adjacent cells we open BOTH cells' passage bits so the wall map
 * stays symmetric. The result is a spanning tree over the grid: fully
 * connected with exactly one simple path between any two cells. Deterministic
 * for a given seed. Never throws.
 */
export function generateMaze(config: DifficultyConfig, seed: number): Maze {
  const { rows, cols } = config;
  const rng = mulberry32(seed);

  const open: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0),
  );
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    new Array<boolean>(cols).fill(false),
  );

  // Iterative DFS with an explicit stack to avoid recursion depth limits on
  // larger grids.
  const stack: Cell[] = [{ r: 0, c: 0 }];
  visited[0][0] = true;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];

    // Collect unvisited neighbours reachable in each direction.
    const candidates: Direction[] = [];
    for (const dir of DIRECTIONS) {
      const { dr, dc } = DIR_DELTA[dir];
      const nr = current.r + dr;
      const nc = current.c + dc;
      if (inBounds(rows, cols, nr, nc) && !visited[nr][nc]) {
        candidates.push(dir);
      }
    }

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const dir = candidates[Math.floor(rng() * candidates.length)];
    const { dr, dc } = DIR_DELTA[dir];
    const nr = current.r + dr;
    const nc = current.c + dc;

    // Carve the passage in both cells.
    open[current.r][current.c] |= DIR_BIT[dir];
    open[nr][nc] |= DIR_BIT[opposite(dir)];

    visited[nr][nc] = true;
    stack.push({ r: nr, c: nc });
  }

  return {
    rows,
    cols,
    open,
    start: { r: 0, c: 0 },
    goal: { r: rows - 1, c: cols - 1 },
    seed,
  };
}

/** True iff the passage from `cell` toward `dir` is open AND stays in bounds. */
export function canMove(maze: Maze, cell: Cell, dir: Direction): boolean {
  const { dr, dc } = DIR_DELTA[dir];
  const nr = cell.r + dr;
  const nc = cell.c + dc;
  if (!inBounds(maze.rows, maze.cols, nr, nc)) return false;
  return (maze.open[cell.r][cell.c] & DIR_BIT[dir]) !== 0;
}

/** Returns the cell reached by moving one step from `cell` in `dir`. */
export function step(cell: Cell, dir: Direction): Cell {
  const { dr, dc } = DIR_DELTA[dir];
  return { r: cell.r + dr, c: cell.c + dc };
}

/**
 * BFS shortest path from `from` to the maze goal, following only open passages.
 * Returns the path as an array of cells inclusive of both ends. In a perfect
 * maze this is the unique simple path. Returns `[from]` when `from` is already
 * the goal. Returns `[from]` if the goal is somehow unreachable (never happens
 * for a well-formed perfect maze, but keeps the function total).
 */
export function solve(maze: Maze, from: Cell): Cell[] {
  const { rows, cols, goal } = maze;

  if (from.r === goal.r && from.c === goal.c) {
    return [from];
  }

  const prev: (Cell | null)[][] = Array.from({ length: rows }, () =>
    new Array<Cell | null>(cols).fill(null),
  );
  const seen: boolean[][] = Array.from({ length: rows }, () =>
    new Array<boolean>(cols).fill(false),
  );

  const queue: Cell[] = [from];
  seen[from.r][from.c] = true;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.r === goal.r && current.c === goal.c) {
      // Reconstruct path from goal back to `from`.
      const path: Cell[] = [];
      let node: Cell | null = current;
      while (node !== null) {
        path.push(node);
        node = prev[node.r][node.c];
      }
      path.reverse();
      return path;
    }

    for (const dir of DIRECTIONS) {
      if (!canMove(maze, current, dir)) continue;
      const next = step(current, dir);
      if (seen[next.r][next.c]) continue;
      seen[next.r][next.c] = true;
      prev[next.r][next.c] = current;
      queue.push(next);
    }
  }

  return [from];
}
