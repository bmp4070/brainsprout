/**
 * The tray (where shuffled pieces start, and where dropped-but-unsnapped
 * pieces can rest) lives directly below the board, in the same normalized
 * coordinate space as the board (fractions of board width/height). These
 * constants describe where that region starts and how tall it is, shared
 * between the reducer (which seeds initial piece positions) and the
 * play-area component (which sizes the tray's DOM box to match).
 */
export const TRAY_TOP_FRAC = 1.12;
export const TRAY_HEIGHT_FRAC = 1.6;
export const TRAY_BOTTOM_FRAC = TRAY_TOP_FRAC + TRAY_HEIGHT_FRAC;
