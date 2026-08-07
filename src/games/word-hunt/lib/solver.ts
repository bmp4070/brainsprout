import { isPrefix, isWord } from './dictionary';
import type { Cell } from './types';

/**
 * Finds every distinct dictionary word (length >= `minLen`) traceable on the
 * grid by an 8-way, no-cell-reused path. Uses prefix pruning so each DFS branch
 * stops the moment its letters can't begin any real word — keeping a 5x5 search
 * near-instant. Returns lowercase words sorted by length ascending, then alpha.
 */
export function solveBoard(grid: string[][], minLen: number): string[] {
  const size = grid.length;
  const found = new Set<string>();

  const visited: boolean[][] = grid.map((row) => row.map(() => false));

  function dfs(cell: Cell, prefix: string): void {
    const next = prefix + grid[cell.row][cell.col].toLowerCase();
    // Prune: if no dictionary word starts with these letters, stop.
    if (!isPrefix(next)) return;
    if (next.length >= minLen && isWord(next)) found.add(next);

    visited[cell.row][cell.col] = true;
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nr = cell.row + dr;
        const nc = cell.col + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (visited[nr][nc]) continue;
        dfs({ row: nr, col: nc }, next);
      }
    }
    visited[cell.row][cell.col] = false;
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      dfs({ row: r, col: c }, '');
    }
  }

  return [...found].sort((a, b) => (a.length - b.length) || (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Returns one traced path (list of cells) that spells `word` on `grid`, or null
 * if it isn't traceable. Used to show a hint or to draw a found word's route.
 */
export function findPath(grid: string[][], word: string): Cell[] | null {
  const size = grid.length;
  const target = word.toLowerCase();
  const visited: boolean[][] = grid.map((row) => row.map(() => false));
  const path: Cell[] = [];

  function dfs(cell: Cell, index: number): boolean {
    if (grid[cell.row][cell.col].toLowerCase() !== target[index]) return false;
    visited[cell.row][cell.col] = true;
    path.push(cell);
    if (index === target.length - 1) return true;
    for (let dr = -1; dr <= 1; dr += 1) {
      for (let dc = -1; dc <= 1; dc += 1) {
        if (dr === 0 && dc === 0) continue;
        const nr = cell.row + dr;
        const nc = cell.col + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (visited[nr][nc]) continue;
        if (dfs({ row: nr, col: nc }, index + 1)) return true;
      }
    }
    visited[cell.row][cell.col] = false;
    path.pop();
    return false;
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (dfs({ row: r, col: c }, 0)) return path;
    }
  }
  return null;
}
