import { mulberry32, pick, randInt } from '../../../shared/lib/rng';
import { ITEM_KINDS, ITEM_SPECS } from './items';
import type { ItemKind, Zone } from './items';
import { getTheme } from './themes';
import type {
  DiffKind,
  Difference,
  DifficultyConfig,
  Puzzle,
  Scene,
  SceneItem,
} from './types';

// Scene space is a 0..100 x 0..100 square.
const SCENE_MIN = 0;
const SCENE_MAX = 100;
const PAD = 1;

// Vertical bands for the top-left y of an item's box, per zone.
const SKY_TOP = 4;
const SKY_BOTTOM = 40;
const GROUND_TOP = 50;
const GROUND_BOTTOM = 92;

const MIN_SCALE = 0.8;
const MAX_SCALE = 1.3;

// Bounded retry budgets (never infinite-loop).
const PLACEMENT_DRAWS_PER_ITEM = 60;
const OVERLAP_REJECT_RATIO = 0.4;

// Hitbox sizing.
const HITBOX_PAD = 2;
const MIN_RADIUS = 6;
const MAX_RADIUS = 14;

// Shift mutation magnitude.
const MIN_SHIFT = 6;
const MAX_SHIFT = 12;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface HitCircle {
  cx: number;
  cy: number;
  radius: number;
}

/** Deterministic 32-bit hash of a string, so themeId perturbs the seed. */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** A uniformly random float in [lo, hi). */
function randRange(rng: () => number, lo: number, hi: number): number {
  return lo + rng() * (hi - lo);
}

function scaledBox(item: SceneItem): Box {
  const spec = ITEM_SPECS[item.kind];
  return { x: item.x, y: item.y, w: spec.w * item.scale, h: spec.h * item.scale };
}

function boxCenter(box: Box): { x: number; y: number } {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

/** Fraction (of the smaller box) that two boxes overlap; 0 when disjoint. */
function overlapRatio(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const inter = ix * iy;
  if (inter <= 0) return 0;
  const smaller = Math.min(a.w * a.h, b.w * b.h);
  return smaller > 0 ? inter / smaller : 0;
}

function zoneBands(zone: Zone): { top: number; bottom: number } {
  if (zone === 'sky') return { top: SKY_TOP, bottom: SKY_BOTTOM };
  if (zone === 'ground') return { top: GROUND_TOP, bottom: GROUND_BOTTOM };
  return { top: SKY_TOP, bottom: GROUND_BOTTOM };
}

/** A weighted kind pool that leans on the theme's preferred kinds. */
function buildKindPool(themeKinds: ItemKind[] | undefined): ItemKind[] {
  if (!themeKinds || themeKinds.length === 0) return [...ITEM_KINDS];
  return [...themeKinds, ...themeKinds, ...ITEM_KINDS];
}

/** Picks a zone-appropriate, in-bounds top-left for a box of size w x h. */
function placeInZone(rng: () => number, zone: Zone, w: number, h: number): { x: number; y: number } {
  const maxX = SCENE_MAX - w - PAD;
  const x = maxX > PAD ? randRange(rng, PAD, maxX) : PAD;

  const band = zoneBands(zone);
  const maxY = SCENE_MAX - h - PAD;
  const top = clamp(band.top, PAD, Math.max(PAD, maxY));
  const bottom = clamp(Math.min(band.bottom, maxY), top, Math.max(top, maxY));
  const y = bottom > top ? randRange(rng, top, bottom) : top;

  return { x, y };
}

/** Builds one placed item of the given kind, respecting its zone and bounds. */
function makeItem(rng: () => number, id: string, kind: ItemKind): SceneItem {
  const spec = ITEM_SPECS[kind];
  const scale = randRange(rng, MIN_SCALE, MAX_SCALE);
  const { x, y } = placeInZone(rng, spec.zone, spec.w * scale, spec.h * scale);
  return {
    id,
    kind,
    x,
    y,
    scale,
    colorIndex: randInt(rng, 7),
    flipped: rng() < 0.5,
  };
}

/**
 * Places `count` items, rejecting a candidate that overlaps an existing item's
 * box by more than OVERLAP_REJECT_RATIO. After a bounded number of draws it
 * accepts the last candidate anyway rather than looping forever.
 */
function placeItems(rng: () => number, count: number, pool: ItemKind[]): SceneItem[] {
  const items: SceneItem[] = [];
  for (let i = 0; i < count; i++) {
    let chosen: SceneItem | null = null;
    for (let draw = 0; draw < PLACEMENT_DRAWS_PER_ITEM; draw++) {
      const candidate = makeItem(rng, `L${i}`, pick(rng, pool));
      const box = scaledBox(candidate);
      const clashes = items.some((it) => overlapRatio(box, scaledBox(it)) > OVERLAP_REJECT_RATIO);
      if (!clashes) {
        chosen = candidate;
        break;
      }
      chosen = candidate; // remember the most recent draw as a fallback
    }
    if (chosen !== null) items.push(chosen);
  }
  return items;
}

function circleForBox(box: Box, extra: number): HitCircle {
  const center = boxCenter(box);
  const halfDiag = 0.5 * Math.hypot(box.w, box.h);
  const radius = clamp(halfDiag + HITBOX_PAD + extra, MIN_RADIUS, MAX_RADIUS);
  return { cx: center.x, cy: center.y, radius };
}

function circleInBounds(c: HitCircle): boolean {
  return (
    c.cx - c.radius >= SCENE_MIN &&
    c.cx + c.radius <= SCENE_MAX &&
    c.cy - c.radius >= SCENE_MIN &&
    c.cy + c.radius <= SCENE_MAX
  );
}

function circlesOverlap(a: HitCircle, b: HitCircle): boolean {
  return Math.hypot(a.cx - b.cx, a.cy - b.cy) < a.radius + b.radius;
}

const DIFF_KIND_POOL: DiffKind[] = [
  'recolor', 'recolor', 'remove', 'resize', 'shift', 'flip', 'add',
];

/** Returns a colorIndex in 0..6 guaranteed different from `from`. */
function differentColor(rng: () => number, from: number): number {
  return (from + 1 + randInt(rng, 6)) % 7;
}

/**
 * Computes a shifted top-left for an item: a noticeable delta that keeps the
 * box in bounds and in its zone, moving at least MIN_SHIFT along one axis so
 * the change is always visible.
 */
function shiftTarget(rng: () => number, item: SceneItem): { x: number; y: number } {
  const box = scaledBox(item);
  const spec = ITEM_SPECS[item.kind];
  const band = zoneBands(spec.zone);
  const maxX = SCENE_MAX - box.w - PAD;
  const maxY = SCENE_MAX - box.h - PAD;
  const yTop = clamp(band.top, PAD, Math.max(PAD, maxY));
  const yBottom = clamp(Math.min(band.bottom, maxY), yTop, Math.max(yTop, maxY));

  const mag = randRange(rng, MIN_SHIFT, MAX_SHIFT);
  const horizontal = rng() < 0.5;

  if (horizontal && maxX > PAD) {
    let nx = clamp(item.x + mag, PAD, maxX);
    if (Math.abs(nx - item.x) < MIN_SHIFT) nx = clamp(item.x - mag, PAD, maxX);
    if (Math.abs(nx - item.x) >= MIN_SHIFT) return { x: nx, y: item.y };
  }
  if (yBottom > yTop) {
    let ny = clamp(item.y + mag, yTop, yBottom);
    if (Math.abs(ny - item.y) < MIN_SHIFT) ny = clamp(item.y - mag, yTop, yBottom);
    if (Math.abs(ny - item.y) >= MIN_SHIFT) return { x: item.x, y: ny };
  }
  // Last resort: nudge x within full bounds so a change is always applied.
  const fx = clamp(item.x + mag, PAD, Math.max(PAD, maxX));
  const nx = Math.abs(fx - item.x) >= MIN_SHIFT ? fx : clamp(item.x - mag, PAD, Math.max(PAD, maxX));
  return { x: nx, y: item.y };
}

/** Finds an open hit-circle center (radius MIN_RADIUS) not clashing with chosen. */
function findOpenCircle(rng: () => number, chosen: HitCircle[]): HitCircle {
  for (let attempt = 0; attempt < 200; attempt++) {
    const cx = randRange(rng, MIN_RADIUS, SCENE_MAX - MIN_RADIUS);
    const cy = randRange(rng, MIN_RADIUS, SCENE_MAX - MIN_RADIUS);
    const c: HitCircle = { cx, cy, radius: MIN_RADIUS };
    if (!chosen.some((o) => circlesOverlap(c, o))) return c;
  }
  // Deterministic grid fallback — scans coarse cells for the first open spot.
  for (let gy = MIN_RADIUS; gy <= SCENE_MAX - MIN_RADIUS; gy += MIN_RADIUS) {
    for (let gx = MIN_RADIUS; gx <= SCENE_MAX - MIN_RADIUS; gx += MIN_RADIUS) {
      const c: HitCircle = { cx: gx, cy: gy, radius: MIN_RADIUS };
      if (!chosen.some((o) => circlesOverlap(c, o))) return c;
    }
  }
  // Extremely unlikely; return a corner circle so we never throw.
  return { cx: MIN_RADIUS, cy: MIN_RADIUS, radius: MIN_RADIUS };
}

interface DiffPlan {
  difference: Difference;
  kind: DiffKind;
  itemIndex: number; // index into left.items, or -1 for 'add'
  addItem?: SceneItem;
  shiftTo?: { x: number; y: number };
}

/**
 * Chooses `diffCount` distinct differences with pairwise non-overlapping,
 * in-bounds hit-circles. Item-based kinds touch a fresh item each; if the
 * item-based attempts run dry, 'add' fills the remainder at open locations so
 * we always reach exactly `diffCount`.
 */
function planDifferences(
  rng: () => number,
  left: Scene,
  diffCount: number,
): DiffPlan[] {
  const plans: DiffPlan[] = [];
  const chosenCircles: HitCircle[] = [];
  const usedItems = new Set<number>();
  let addCounter = 0;

  const maxAttempts = diffCount * 40 + 200;
  for (let attempt = 0; attempt < maxAttempts && plans.length < diffCount; attempt++) {
    const kind = pick(rng, DIFF_KIND_POOL);

    if (kind === 'add') {
      const circle = findOpenCircle(rng, chosenCircles);
      if (!circleInBounds(circle)) continue;
      const poolKind = pick(rng, ITEM_KINDS);
      const spec = ITEM_SPECS[poolKind];
      const scale = randRange(rng, MIN_SCALE, MAX_SCALE);
      const w = spec.w * scale;
      const h = spec.h * scale;
      const addItem: SceneItem = {
        id: `A${addCounter}`,
        kind: poolKind,
        x: clamp(circle.cx - w / 2, PAD, SCENE_MAX - w - PAD),
        y: clamp(circle.cy - h / 2, PAD, SCENE_MAX - h - PAD),
        scale,
        colorIndex: randInt(rng, 7),
        flipped: rng() < 0.5,
      };
      addCounter++;
      chosenCircles.push(circle);
      plans.push({
        difference: {
          id: `D${plans.length}`,
          kind: 'add',
          cx: circle.cx,
          cy: circle.cy,
          radius: circle.radius,
        },
        kind: 'add',
        itemIndex: -1,
        addItem,
      });
      continue;
    }

    // Item-based kind: pick an unused item.
    if (usedItems.size >= left.items.length) continue;
    const itemIndex = randInt(rng, left.items.length);
    if (usedItems.has(itemIndex)) continue;
    const item = left.items[itemIndex];
    const box = scaledBox(item);

    let circle: HitCircle;
    let shiftTo: { x: number; y: number } | undefined;
    if (kind === 'shift') {
      // Center the hitbox on the midpoint between the old and new box centers,
      // so a tap on EITHER image lands, and pad the radius by half the move.
      shiftTo = shiftTarget(rng, item);
      const oldCenter = boxCenter(box);
      const newCenter = boxCenter({ x: shiftTo.x, y: shiftTo.y, w: box.w, h: box.h });
      const mid = { x: (oldCenter.x + newCenter.x) / 2, y: (oldCenter.y + newCenter.y) / 2 };
      const moveDist = Math.hypot(newCenter.x - oldCenter.x, newCenter.y - oldCenter.y);
      const halfDiag = 0.5 * Math.hypot(box.w, box.h);
      const radius = clamp(halfDiag + moveDist / 2 + HITBOX_PAD, MIN_RADIUS, MAX_RADIUS);
      circle = { cx: mid.x, cy: mid.y, radius };
    } else {
      circle = circleForBox(box, 0);
    }

    if (!circleInBounds(circle)) continue;
    if (chosenCircles.some((o) => circlesOverlap(circle, o))) continue;

    usedItems.add(itemIndex);
    chosenCircles.push(circle);
    plans.push({
      difference: {
        id: `D${plans.length}`,
        kind,
        cx: circle.cx,
        cy: circle.cy,
        radius: circle.radius,
      },
      kind,
      itemIndex,
      shiftTo,
    });
  }

  // Guaranteed fill: if item-based choices fell short, add differences at open
  // spots until we hit diffCount exactly.
  while (plans.length < diffCount) {
    const circle = findOpenCircle(rng, chosenCircles);
    const poolKind = pick(rng, ITEM_KINDS);
    const spec = ITEM_SPECS[poolKind];
    const scale = randRange(rng, MIN_SCALE, MAX_SCALE);
    const w = spec.w * scale;
    const h = spec.h * scale;
    const addItem: SceneItem = {
      id: `A${addCounter}`,
      kind: poolKind,
      x: clamp(circle.cx - w / 2, PAD, SCENE_MAX - w - PAD),
      y: clamp(circle.cy - h / 2, PAD, SCENE_MAX - h - PAD),
      scale,
      colorIndex: randInt(rng, 7),
      flipped: rng() < 0.5,
    };
    addCounter++;
    chosenCircles.push(circle);
    plans.push({
      difference: {
        id: `D${plans.length}`,
        kind: 'add',
        cx: circle.cx,
        cy: circle.cy,
        radius: circle.radius,
      },
      kind: 'add',
      itemIndex: -1,
      addItem,
    });
  }

  return plans;
}

/** Applies each planned mutation to the RIGHT scene (a deep copy of LEFT). */
function applyDifferences(rng: () => number, right: Scene, plans: DiffPlan[]): void {
  // Removals/adds change the array; mutate by id to stay index-safe. We collect
  // removals and apply them after the id-based edits.
  const removeIds = new Set<string>();

  for (const plan of plans) {
    if (plan.kind === 'add') {
      if (plan.addItem) right.items.push(plan.addItem);
      continue;
    }
    // itemIndex refers to LEFT/RIGHT (same ordering pre-removal) — resolve by id.
    const item = right.items[plan.itemIndex];
    switch (plan.kind) {
      case 'recolor':
        item.colorIndex = differentColor(rng, item.colorIndex);
        break;
      case 'resize':
        item.scale = item.scale * (rng() < 0.5 ? 1.4 : 0.6);
        break;
      case 'shift':
        if (plan.shiftTo) {
          item.x = plan.shiftTo.x;
          item.y = plan.shiftTo.y;
        }
        break;
      case 'flip':
        item.flipped = !item.flipped;
        break;
      case 'remove':
        removeIds.add(item.id);
        break;
    }
  }

  if (removeIds.size > 0) {
    right.items = right.items.filter((it) => !removeIds.has(it.id));
  }
}

function cloneScene(scene: Scene): Scene {
  return { items: scene.items.map((it) => ({ ...it })) };
}

/**
 * Generates a deterministic Spot the Difference puzzle for the given
 * (difficulty, seed, themeId). The LEFT scene holds `itemCount` items; the
 * RIGHT scene is LEFT with exactly `diffCount` differences applied, each with a
 * pairwise non-overlapping, in-bounds circular hitbox. Never throws; never
 * loops unbounded.
 */
export function generatePuzzle(
  difficulty: DifficultyConfig,
  seed: number,
  themeId: string,
): Puzzle {
  const theme = getTheme(themeId);
  const rng = mulberry32((seed ^ hashString(themeId)) >>> 0);

  const pool = buildKindPool(theme.kinds);
  const left: Scene = { items: placeItems(rng, difficulty.itemCount, pool) };

  const right = cloneScene(left);
  const plans = planDifferences(rng, left, difficulty.diffCount);
  applyDifferences(rng, right, plans);

  const differences: Difference[] = plans.map((p) => p.difference);

  return { left, right, differences, themeId, seed };
}
