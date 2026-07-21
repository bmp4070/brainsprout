/**
 * The tray (where shuffled pieces start, and where dropped-but-unsnapped
 * pieces can rest) sits either directly below the board (narrow/portrait
 * screens, `'below'`) or as a vertical column to the right of the board
 * (wide screens, `'side'`), always in the same normalized coordinate space
 * as the board (fractions of board width/height — a fraction can exceed 1
 * on whichever axis the tray extends along). These helpers/constants are
 * shared between the reducer (which seeds initial piece positions and
 * remaps them when the mode changes) and the play-area component (which
 * sizes the tray's DOM box to match and decides which mode applies).
 */

export type TrayMode = 'below' | 'side';

/** A rectangular region in board-fraction space (0..1 covers the board itself). */
export interface FracRect {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Container width (CSS px) at or above which the side tray kicks in. */
export const SIDE_TRAY_MIN_CONTAINER_WIDTH = 1000;

// 'below' mode: a compact strip directly under the board, sized to roughly
// 0.4-0.5 board-heights tall so it plus the board plus the HUD fit one
// portrait viewport with no scrolling.
const BELOW_TRAY_LEFT = 0.03;
const BELOW_TRAY_RIGHT = 0.91;
const BELOW_TRAY_TOP = 1.08;
const BELOW_TRAY_HEIGHT = 0.46;

// 'side' mode: a vertical column to the right of the board, roughly
// board-height tall and 35-40% of the board's width wide, using the
// horizontal space that's otherwise empty next to a width-capped board.
const SIDE_TRAY_LEFT = 1.06;
const SIDE_TRAY_WIDTH = 0.4;
const SIDE_TRAY_TOP = 0.02;
const SIDE_TRAY_BOTTOM = 0.98;

/** Decides which tray layout applies for a given available container width. */
export function trayModeForWidth(containerWidth: number): TrayMode {
  return containerWidth >= SIDE_TRAY_MIN_CONTAINER_WIDTH ? 'side' : 'below';
}

/** The tray's rectangle, in board-fraction space, for the given mode. */
export function getTrayRect(mode: TrayMode): FracRect {
  return mode === 'side'
    ? { x0: SIDE_TRAY_LEFT, x1: SIDE_TRAY_LEFT + SIDE_TRAY_WIDTH, y0: SIDE_TRAY_TOP, y1: SIDE_TRAY_BOTTOM }
    : { x0: BELOW_TRAY_LEFT, x1: BELOW_TRAY_RIGHT, y0: BELOW_TRAY_TOP, y1: BELOW_TRAY_TOP + BELOW_TRAY_HEIGHT };
}

/**
 * The full valid region a piece may occupy (board ∪ tray) for the given
 * mode, in board-fraction space. Used to clamp drop positions so a flung
 * piece always lands somewhere reachable.
 */
export function getPlayRect(mode: TrayMode): FracRect {
  const tray = getTrayRect(mode);
  return {
    x0: Math.min(0, tray.x0),
    x1: Math.max(1, tray.x1),
    y0: Math.min(0, tray.y0),
    y1: Math.max(1, tray.y1),
  };
}

/**
 * How large the outer play-area box needs to be, in units of board
 * width/height, to contain the board and the tray for the given mode.
 */
export function getOuterExtentFrac(mode: TrayMode): { width: number; height: number } {
  const rect = getPlayRect(mode);
  return { width: rect.x1 - rect.x0, height: rect.y1 - rect.y0 };
}
