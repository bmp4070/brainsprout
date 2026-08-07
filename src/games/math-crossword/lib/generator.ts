import { mulberry32, pick, randInt } from '../../../shared/lib/rng';
import type { Blank, Cell, DifficultyConfig, Op, Puzzle } from './types';

/**
 * Math Crossword is built in two stages:
 *
 *   1. A *layout* places number cells on the grid and links triples of them
 *      into equations (`a op b = c`). Layouts scale with difficulty — a small
 *      ring for easy, a bigger ring for medium, a ring + centre cross for hard —
 *      so the board literally grows.
 *   2. A generic constraint solver assigns operators and integer values so every
 *      equation holds, using propagation (fill any equation with one unknown)
 *      plus seeded guesses and bounded restarts. This one engine handles any
 *      layout, cycles included, so adding a new shape needs no new solver.
 */

interface Pos {
  row: number;
  col: number;
}

/** An equation over three colinear number cells: cells[0] op cells[1] = cells[2]. */
interface Equation {
  cells: [string, string, string];
}

interface Layout {
  size: number;
  /** All number-cell positions, keyed "row,col". */
  cells: Map<string, Pos>;
  equations: Equation[];
}

const key = (row: number, col: number): string => `${row},${col}`;

/** Midpoint between two colinear positions (used to place op / = cells). */
function mid(a: Pos, b: Pos): Pos {
  return { row: (a.row + b.row) / 2, col: (a.col + b.col) / 2 };
}

function addEquation(layout: Layout, a: Pos, b: Pos, c: Pos): void {
  for (const p of [a, b, c]) layout.cells.set(key(p.row, p.col), p);
  layout.equations.push({ cells: [key(a.row, a.col), key(b.row, b.col), key(c.row, c.col)] });
}

/** Adds the overlapping-triple equations along a line of number coords. */
function addLineEquations(layout: Layout, coords: number[], atRow: (i: number) => Pos): void {
  // Triples (0,1,2),(2,3,4),... so operator/equals cells never clash.
  for (let m = 0; m + 2 < coords.length; m += 2) {
    addEquation(layout, atRow(m), atRow(m + 1), atRow(m + 2));
  }
}

/**
 * Builds the equation layout. `fill: 'full'` makes EVERY number row and column
 * an equation, so the board fills in like a real crossword (only the small
 * diagonal gaps between equations stay empty). `fill: 'ring'` uses only the four
 * edges. The number-grid is `ringPerSide` cells per side (odd), giving a
 * `size x size` board that grows with difficulty.
 */
function buildLayout(cfg: DifficultyConfig): Layout {
  const size = cfg.size;
  const last = size - 1;
  const layout: Layout = { size, cells: new Map(), equations: [] };

  // Coordinates of number cells along one side (0, 2, 4, ... last).
  const coords: number[] = [];
  for (let i = 0; i < cfg.ringPerSide; i += 1) coords.push(i * 2);

  if (cfg.fill === 'full') {
    // Every number row and every number column is a chain of equations.
    for (const line of coords) {
      addLineEquations(layout, coords, (m) => ({ row: line, col: coords[m] })); // horizontal
      addLineEquations(layout, coords, (m) => ({ row: coords[m], col: line })); // vertical
    }
  } else {
    // Ring: the four edges carry equations.
    addLineEquations(layout, coords, (m) => ({ row: 0, col: coords[m] }));
    addLineEquations(layout, coords, (m) => ({ row: last, col: coords[m] }));
    addLineEquations(layout, coords, (m) => ({ row: coords[m], col: 0 }));
    addLineEquations(layout, coords, (m) => ({ row: coords[m], col: last }));
    if (cfg.fill === 'cross') {
      // Plus a middle row + column through the centre, so the middle fills in.
      const midCoord = coords[(coords.length - 1) / 2];
      addLineEquations(layout, coords, (m) => ({ row: midCoord, col: coords[m] }));
      addLineEquations(layout, coords, (m) => ({ row: coords[m], col: midCoord }));
    }
  }

  return layout;
}

function apply(op: Op, a: number, b: number): number {
  if (op === '×') return a * b;
  if (op === '−') return a - b;
  return a + b;
}

const MAX_NUM = 100; // keep every displayed number readable (<= 3 digits)

function inRange(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && n <= MAX_NUM;
}

/** Derives the single unknown cell of an equation, or null if impossible. */
function derive(op: Op, a: number | undefined, b: number | undefined, c: number | undefined): { slot: 0 | 1 | 2; value: number } | null {
  if (a === undefined && b !== undefined && c !== undefined) {
    // a op b = c  ->  solve a
    if (op === '×') return b !== 0 && c % b === 0 ? { slot: 0, value: c / b } : null;
    if (op === '−') return { slot: 0, value: c + b }; // a = c + b
    return { slot: 0, value: c - b }; // '+': a = c - b
  }
  if (b === undefined && a !== undefined && c !== undefined) {
    if (op === '×') return a !== 0 && c % a === 0 ? { slot: 1, value: c / a } : null;
    if (op === '−') return { slot: 1, value: a - c }; // b = a - c
    return { slot: 1, value: c - a }; // '+': b = c - a
  }
  if (c === undefined && a !== undefined && b !== undefined) {
    return { slot: 2, value: apply(op, a, b) };
  }
  return null;
}

/** True iff a fully-assigned equation obeys the difficulty's range rules. */
function validEquation(op: Op, a: number, b: number, c: number, cfg: DifficultyConfig): boolean {
  if (!inRange(a) || !inRange(b) || !inRange(c)) return false;
  if (apply(op, a, b) !== c) return false;
  if (op === '×') return a >= 1 && b >= 1 && a <= cfg.maxFactor && b <= cfg.maxFactor;
  if (op === '−') return a >= 1 && b >= 1 && a >= b;
  return a >= 1 && b >= 1;
}

interface Solution {
  values: Map<string, number>;
  ops: Op[]; // one per equation, aligned with layout.equations
}

/** Max value for a cell: factor-sized if it's a × operand in any equation. */
function cellMax(cellKey: string, layout: Layout, ops: Op[], cfg: DifficultyConfig): number {
  let mustBeFactor = false;
  layout.equations.forEach((eq, i) => {
    if (ops[i] === '×' && (eq.cells[0] === cellKey || eq.cells[1] === cellKey)) mustBeFactor = true;
  });
  return mustBeFactor ? cfg.maxFactor : cfg.maxTerm;
}

/**
 * Constraint propagation over a partial assignment (mutates `values`). Fills any
 * equation that has exactly one unknown; returns false on a contradiction
 * (a fully-known equation that doesn't hold, or a derived value out of range).
 */
function propagate(layout: Layout, ops: Op[], values: Map<string, number>): boolean {
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (let i = 0; i < layout.equations.length; i += 1) {
      const [ka, kb, kc] = layout.equations[i].cells;
      const a = values.get(ka);
      const b = values.get(kb);
      const c = values.get(kc);
      const known = (a !== undefined ? 1 : 0) + (b !== undefined ? 1 : 0) + (c !== undefined ? 1 : 0);
      if (known === 3) {
        if (apply(ops[i], a as number, b as number) !== (c as number)) return false;
      } else if (known === 2) {
        const d = derive(ops[i], a, b, c);
        if (d === null || !inRange(d.value) || d.value < (d.slot === 2 ? 0 : 1)) return false;
        values.set(layout.equations[i].cells[d.slot], d.value);
        progressed = true;
      }
    }
  }
  return true;
}

/**
 * One solve attempt for a fixed random operator assignment: recursive value
 * backtracking with propagation. Because propagation resolves everything a
 * guess forces (and backtracks on any contradiction), this finds a consistent
 * assignment whenever one exists for these operators — so dense, cyclic layouts
 * that pure random guessing could never satisfy now solve reliably. A node
 * budget guards against pathological blow-ups (the attempt just fails and the
 * caller retries with fresh operators).
 */
function attemptSolve(layout: Layout, cfg: DifficultyConfig, rng: () => number): Solution | null {
  const ops: Op[] = layout.equations.map(() => pick(rng, cfg.ops));
  const totalCells = layout.cells.size;
  const budget = { nodes: 4000 };

  function search(values: Map<string, number>): Map<string, number> | null {
    if (budget.nodes-- <= 0) return null;
    if (!propagate(layout, ops, values)) return null;
    if (values.size === totalCells) return values;

    // Pick an unassigned operand cell to branch on (any equation with a hole).
    let branchKey: string | null = null;
    for (const eq of layout.equations) {
      const openOperand = [eq.cells[0], eq.cells[1]].find((k) => !values.has(k));
      if (openOperand !== undefined) {
        branchKey = openOperand;
        break;
      }
    }
    if (branchKey === null) return null; // only result cells left but underivable

    const max = cellMax(branchKey, layout, ops, cfg);
    const domain = Array.from({ length: max }, (_, i) => i + 1).sort(() => rng() - 0.5);
    for (const v of domain) {
      const next = new Map(values);
      next.set(branchKey, v);
      const solved = search(next);
      if (solved !== null) return solved;
      if (budget.nodes <= 0) return null;
    }
    return null;
  }

  const result = search(new Map<string, number>());
  if (result === null) return null;

  for (let i = 0; i < layout.equations.length; i += 1) {
    const [ka, kb, kc] = layout.equations[i].cells;
    if (!validEquation(ops[i], result.get(ka)!, result.get(kb)!, result.get(kc)!, cfg)) return null;
  }
  return { values: result, ops };
}

/** Builds 4 distinct choices (answer + 3 near distractors), shuffled. */
function makeChoices(rng: () => number, answer: number): { choices: number[]; correctIndex: number } {
  const set = new Set<number>([answer]);
  const spread = Math.max(2, Math.round(answer * 0.3));
  let guard = 0;
  while (set.size < 4 && guard < 60) {
    guard += 1;
    const delta = 1 + randInt(rng, spread);
    const candidate = answer + (rng() < 0.5 ? -delta : delta);
    if (candidate >= 0 && candidate <= MAX_NUM) set.add(candidate);
  }
  let extra = answer + 1;
  while (set.size < 4) {
    if (extra >= 0 && extra <= MAX_NUM) set.add(extra);
    extra += 1;
  }
  const choices = [...set].sort(() => rng() - 0.5);
  return { choices, correctIndex: choices.indexOf(answer) };
}

/**
 * Chooses `count` blank cells so no equation contains more than one blank
 * (guaranteeing each blank is uniquely solvable from a visible equation). Tries
 * shuffled greedy passes to reach the exact count, keeping variety.
 */
function chooseBlanks(rng: () => number, layout: Layout, count: number): Set<string> {
  const cellKeys = [...layout.cells.keys()];
  // Map each cell -> the equations it appears in.
  const cellEqs = new Map<string, number[]>();
  layout.equations.forEach((eq, i) => {
    for (const k of eq.cells) {
      const list = cellEqs.get(k) ?? [];
      list.push(i);
      cellEqs.set(k, list);
    }
  });

  function greedy(order: string[]): Set<string> {
    const usedEq = new Set<number>();
    const chosen = new Set<string>();
    for (const k of order) {
      if (chosen.size >= count) break;
      const eqs = cellEqs.get(k) ?? [];
      if (eqs.some((e) => usedEq.has(e))) continue;
      eqs.forEach((e) => usedEq.add(e));
      chosen.add(k);
    }
    return chosen;
  }

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const order = [...cellKeys].sort(() => rng() - 0.5);
    const chosen = greedy(order);
    if (chosen.size === count) return chosen;
  }
  // Fallback: cells that live in exactly one equation pack most densely.
  const singles = cellKeys.filter((k) => (cellEqs.get(k) ?? []).length === 1).sort(() => rng() - 0.5);
  return greedy([...singles, ...cellKeys]);
}

function emptyGrid(size: number): Cell[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ kind: 'empty' }) as Cell),
  );
}

/** Renders the solved layout into a grid, placing op/= cells and blanks. */
function render(layout: Layout, sol: Solution, blankKeys: Set<string>, rng: () => number): { grid: Cell[][]; blanks: Blank[] } {
  const grid = emptyGrid(layout.size);

  // Operator + equals cells, derived from each equation's geometry.
  layout.equations.forEach((eq, i) => {
    const [ka, kb, kc] = eq.cells;
    const pa = layout.cells.get(ka)!;
    const pb = layout.cells.get(kb)!;
    const pc = layout.cells.get(kc)!;
    const opPos = mid(pa, pb);
    const eqPos = mid(pb, pc);
    grid[opPos.row][opPos.col] = { kind: 'op', symbol: sol.ops[i] };
    grid[eqPos.row][eqPos.col] = { kind: 'op', symbol: '=' };
  });

  // Number cells (given or blank). Sort for stable blank ids (row-major).
  const blanks: Blank[] = [];
  const orderedKeys = [...layout.cells.keys()].sort((a, b) => {
    const pa = layout.cells.get(a)!;
    const pb = layout.cells.get(b)!;
    return pa.row - pb.row || pa.col - pb.col;
  });
  let nextId = 0;
  for (const k of orderedKeys) {
    const pos = layout.cells.get(k)!;
    const value = sol.values.get(k)!;
    if (blankKeys.has(k)) {
      const id = nextId++;
      const { choices, correctIndex } = makeChoices(rng, value);
      grid[pos.row][pos.col] = { kind: 'num', value, blankId: id };
      blanks.push({ id, row: pos.row, col: pos.col, answer: value, choices, correctIndex });
    } else {
      grid[pos.row][pos.col] = { kind: 'num', value, blankId: null };
    }
  }
  return { grid, blanks };
}

/**
 * Generates a Math Crossword whose board size scales with difficulty. Uses
 * bounded seeded retries: each attempt solves the difficulty's layout, and — for
 * difficulties teaching both operators — is kept only if it uses both × and −
 * (so every puzzle practises each). Deterministic given `seed`; never throws —
 * a pathological run falls back to a trivial all-× solution.
 */
export function generatePuzzle(difficulty: DifficultyConfig, seed: number): Puzzle {
  const rng = mulberry32(seed >>> 0);
  const layout = buildLayout(difficulty);
  const wantMix = difficulty.ops.includes('−') && difficulty.ops.includes('×');

  let solution: Solution | null = null;
  for (let attempt = 0; attempt < 800 && solution === null; attempt += 1) {
    const candidate = attemptSolve(layout, difficulty, rng);
    if (candidate === null) continue;
    if (wantMix && !(candidate.ops.includes('−') && candidate.ops.includes('×'))) continue;
    solution = candidate;
  }

  if (solution === null) {
    // Defensive fallback: everything is 1, every op ×, which always validates.
    const values = new Map<string, number>();
    for (const k of layout.cells.keys()) values.set(k, 1);
    solution = { values, ops: layout.equations.map(() => '×' as Op) };
  }

  const blankKeys = chooseBlanks(rng, layout, difficulty.blanks);
  const { grid, blanks } = render(layout, solution, blankKeys, rng);
  return { grid, blanks, difficulty, seed };
}
