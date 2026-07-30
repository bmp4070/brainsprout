import { describe, expect, it } from 'vitest';
import { canMove, generateMaze, solve, step } from './maze';
import {
  DIFFICULTIES,
  DIRECTIONS,
  DIR_BIT,
  cellKey,
  opposite,
  type Cell,
  type DifficultyConfig,
  type Maze,
} from './types';

const ALL_DIFFICULTIES: DifficultyConfig[] = [
  DIFFICULTIES.easy,
  DIFFICULTIES.medium,
  DIFFICULTIES.hard,
];

/** Flood-fills open passages from start; returns the count of reachable cells. */
function reachableCount(maze: Maze): number {
  const seen = new Set<string>();
  const queue: Cell[] = [maze.start];
  seen.add(cellKey(maze.start));
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const dir of DIRECTIONS) {
      if (!canMove(maze, cur, dir)) continue;
      const next = step(cur, dir);
      const key = cellKey(next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push(next);
    }
  }
  return seen.size;
}

/** Asserts open bits are symmetric between adjacent cells. */
function assertSymmetric(maze: Maze): void {
  for (let r = 0; r < maze.rows; r++) {
    for (let c = 0; c < maze.cols; c++) {
      for (const dir of DIRECTIONS) {
        if ((maze.open[r][c] & DIR_BIT[dir]) === 0) continue;
        const next = step({ r, c }, dir);
        expect(next.r).toBeGreaterThanOrEqual(0);
        expect(next.r).toBeLessThan(maze.rows);
        expect(next.c).toBeGreaterThanOrEqual(0);
        expect(next.c).toBeLessThan(maze.cols);
        expect(maze.open[next.r][next.c] & DIR_BIT[opposite(dir)]).not.toBe(0);
      }
    }
  }
}

describe('generateMaze', () => {
  it('is deterministic per seed', () => {
    const a = generateMaze(DIFFICULTIES.medium, 12345);
    const b = generateMaze(DIFFICULTIES.medium, 12345);
    expect(a.open).toEqual(b.open);
    expect(a.seed).toBe(12345);
  });

  it('produces different mazes for different seeds', () => {
    const a = generateMaze(DIFFICULTIES.medium, 1);
    const b = generateMaze(DIFFICULTIES.medium, 2);
    expect(a.open).not.toEqual(b.open);
  });

  it('sets start and goal at the corners', () => {
    const maze = generateMaze(DIFFICULTIES.easy, 7);
    expect(maze.start).toEqual({ r: 0, c: 0 });
    expect(maze.goal).toEqual({ r: 7, c: 7 });
  });

  it('has symmetric open bits', () => {
    const maze = generateMaze(DIFFICULTIES.medium, 99);
    assertSymmetric(maze);
  });

  it('is a perfect maze: every cell reachable from start', () => {
    for (const config of ALL_DIFFICULTIES) {
      const maze = generateMaze(config, 42);
      expect(reachableCount(maze)).toBe(config.rows * config.cols);
    }
  });

  it('never throws and stays connected across 40 seeds x 3 difficulties', () => {
    for (let seed = 0; seed < 40; seed++) {
      for (const config of ALL_DIFFICULTIES) {
        const maze = generateMaze(config, seed);
        expect(reachableCount(maze)).toBe(config.rows * config.cols);
        assertSymmetric(maze);
      }
    }
  });
});

describe('canMove', () => {
  it('respects walls and bounds', () => {
    const maze = generateMaze(DIFFICULTIES.easy, 3);
    // Out of bounds directions from the start corner are never movable.
    expect(canMove(maze, maze.start, 'up')).toBe(false);
    expect(canMove(maze, maze.start, 'left')).toBe(false);
    // A direction is movable iff its open bit is set.
    for (const dir of DIRECTIONS) {
      const open = (maze.open[0][0] & DIR_BIT[dir]) !== 0;
      const next = step(maze.start, dir);
      const inBounds =
        next.r >= 0 && next.r < maze.rows && next.c >= 0 && next.c < maze.cols;
      expect(canMove(maze, maze.start, dir)).toBe(open && inBounds);
    }
  });
});

describe('solve', () => {
  it('returns [goal] when starting at the goal', () => {
    const maze = generateMaze(DIFFICULTIES.easy, 5);
    const path = solve(maze, maze.goal);
    expect(path).toEqual([maze.goal]);
  });

  it('returns a valid connected path from start to goal', () => {
    const maze = generateMaze(DIFFICULTIES.medium, 88);
    const path = solve(maze, maze.start);
    expect(path[0]).toEqual(maze.start);
    expect(path[path.length - 1]).toEqual(maze.goal);
    // Each consecutive pair is one open-passage step apart.
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const dir = DIRECTIONS.find((d) => {
        const s = step(from, d);
        return s.r === to.r && s.c === to.c;
      });
      expect(dir).toBeDefined();
      expect(canMove(maze, from, dir!)).toBe(true);
    }
  });

  it('finds the unique shortest path in every difficulty', () => {
    for (const config of ALL_DIFFICULTIES) {
      const maze = generateMaze(config, 17);
      const path = solve(maze, maze.start);
      expect(path[0]).toEqual(maze.start);
      expect(path[path.length - 1]).toEqual(maze.goal);
      expect(path.length).toBeGreaterThanOrEqual(config.rows + config.cols - 1);
    }
  });
});

describe('step', () => {
  it('applies the direction delta', () => {
    expect(step({ r: 2, c: 3 }, 'up')).toEqual({ r: 1, c: 3 });
    expect(step({ r: 2, c: 3 }, 'right')).toEqual({ r: 2, c: 4 });
    expect(step({ r: 2, c: 3 }, 'down')).toEqual({ r: 3, c: 3 });
    expect(step({ r: 2, c: 3 }, 'left')).toEqual({ r: 2, c: 2 });
  });
});
