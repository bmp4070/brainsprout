import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './useJigsaw';
import type { JigsawState } from './useJigsaw';
import { DIFFICULTIES, pieceCount } from '../lib/types';
import { scenes } from '../scenes';
import { getTrayRect } from '../lib/trayLayout';
import type { TrayMode } from '../lib/trayLayout';

const scene = scenes[0];

function start(seed = 1, trayMode: TrayMode = 'below'): JigsawState {
  return reducer(initialState, {
    type: 'START',
    difficulty: DIFFICULTIES.easy,
    scene,
    seed,
    now: 1000,
    trayMode,
  });
}

describe('jigsaw reducer', () => {
  it('starts a game in the playing phase with a full tray of unlocked pieces', () => {
    const state = start();
    expect(state.phase).toBe('playing');
    expect(state.scene).toBe(scene);
    expect(state.difficulty).toBe(DIFFICULTIES.easy);
    expect(state.lockedCount).toBe(0);
    expect(state.startTime).toBe(1000);
    expect(state.trayMode).toBe('below');
    expect(state.positions).not.toBeNull();
    const total = pieceCount(DIFFICULTIES.easy);
    let flatCount = 0;
    for (const row of state.positions ?? []) {
      for (const piece of row) {
        expect(piece.locked).toBe(false);
        flatCount++;
      }
    }
    expect(flatCount).toBe(total);
  });

  it('scatters pieces within the tray rect for the given trayMode', () => {
    const below = start(1, 'below');
    const belowRect = getTrayRect('below');
    for (const row of below.positions ?? []) {
      for (const piece of row) {
        expect(piece.xFrac).toBeGreaterThanOrEqual(belowRect.x0);
        expect(piece.xFrac).toBeLessThan(belowRect.x1);
        expect(piece.yFrac).toBeGreaterThanOrEqual(belowRect.y0);
        expect(piece.yFrac).toBeLessThan(belowRect.y1);
      }
    }

    const side = start(1, 'side');
    const sideRect = getTrayRect('side');
    for (const row of side.positions ?? []) {
      for (const piece of row) {
        expect(piece.xFrac).toBeGreaterThanOrEqual(sideRect.x0);
        expect(piece.xFrac).toBeLessThan(sideRect.x1);
        expect(piece.yFrac).toBeGreaterThanOrEqual(sideRect.y0);
        expect(piece.yFrac).toBeLessThan(sideRect.y1);
      }
    }
  });

  it('is deterministic for a given seed', () => {
    expect(start(7)).toEqual(start(7));
  });

  it('picks up an unlocked piece', () => {
    const playing = start();
    const picked = reducer(playing, { type: 'PICK_UP', row: 0, col: 0 });
    expect(picked.dragging).toEqual({ row: 0, col: 0 });
  });

  it('bumps a piece above every other unlocked piece when picked up', () => {
    let state = start();
    const total = pieceCount(DIFFICULTIES.easy);
    const highestBefore = Math.max(...state.positions!.flat().map((p) => p.zOrder));

    state = reducer(state, { type: 'PICK_UP', row: 1, col: 1 });
    const picked = state.positions![1][1];
    const others = state.positions!.flat().filter((p) => p !== picked);
    expect(picked.zOrder).toBeGreaterThan(highestBefore);
    for (const other of others) {
      expect(picked.zOrder).toBeGreaterThan(other.zOrder);
    }

    // Dropping it back unlocked keeps it on top of the pile.
    state = reducer(state, { type: 'DROP', row: 1, col: 1, xFrac: 0.5, yFrac: 1.2, snapped: false });
    const droppedZOrder = state.positions![1][1].zOrder;
    expect(droppedZOrder).toBeGreaterThan(highestBefore);

    // Picking up a different piece next bumps it above the previous one.
    state = reducer(state, { type: 'PICK_UP', row: 0, col: 0 });
    expect(state.positions![0][0].zOrder).toBeGreaterThan(droppedZOrder);

    expect(total).toBeGreaterThan(0);
  });

  it('locks a piece exactly once when dropped with snapped=true', () => {
    let state = start();
    state = reducer(state, { type: 'PICK_UP', row: 0, col: 0 });
    state = reducer(state, { type: 'DROP', row: 0, col: 0, xFrac: 0, yFrac: 0, snapped: true });

    expect(state.positions?.[0][0].locked).toBe(true);
    expect(state.lockedCount).toBe(1);
    expect(state.dragging).toBeNull();

    // Picking it up again should be a no-op since it's locked.
    const afterPickup = reducer(state, { type: 'PICK_UP', row: 0, col: 0 });
    expect(afterPickup.dragging).toBeNull();
  });

  it('does not lock a piece when dropped far from its slot (snapped=false)', () => {
    let state = start();
    state = reducer(state, { type: 'PICK_UP', row: 1, col: 2 });
    state = reducer(state, {
      type: 'DROP',
      row: 1,
      col: 2,
      xFrac: 0.9,
      yFrac: 0.9,
      snapped: false,
    });

    expect(state.positions?.[1][2].locked).toBe(false);
    expect(state.positions?.[1][2].xFrac).toBe(0.9);
    expect(state.positions?.[1][2].yFrac).toBe(0.9);
    expect(state.lockedCount).toBe(0);
    expect(state.dragging).toBeNull();
  });

  it('moves a dragged piece to the given fraction', () => {
    let state = start();
    state = reducer(state, { type: 'PICK_UP', row: 0, col: 1 });
    state = reducer(state, { type: 'MOVE', row: 0, col: 1, xFrac: 0.4, yFrac: 0.55 });
    expect(state.positions?.[0][1].xFrac).toBe(0.4);
    expect(state.positions?.[0][1].yFrac).toBe(0.55);
    expect(state.positions?.[0][1].rotation).toBe(0);
  });

  it('reaches the won phase once every piece is locked', () => {
    let state = start();
    const total = pieceCount(DIFFICULTIES.easy);
    let count = 0;
    for (let r = 0; r < DIFFICULTIES.easy.rows; r++) {
      for (let c = 0; c < DIFFICULTIES.easy.cols; c++) {
        state = reducer(state, { type: 'PICK_UP', row: r, col: c });
        state = reducer(state, { type: 'DROP', row: r, col: c, xFrac: 0, yFrac: 0, snapped: true });
        count++;
        if (count < total) {
          expect(state.phase).toBe('playing');
        }
      }
    }
    expect(state.lockedCount).toBe(total);
    expect(state.phase).toBe('won');
  });

  it('advances elapsedMs on TICK while playing, not while picking', () => {
    const playing = start();
    const ticked = reducer(playing, { type: 'TICK', now: 3500 });
    expect(ticked.elapsedMs).toBe(2500);

    const notPlaying = reducer(initialState, { type: 'TICK', now: 3500 });
    expect(notPlaying.elapsedMs).toBe(0);
  });

  it('resets back to the initial picking state', () => {
    const playing = start();
    const reset = reducer(playing, { type: 'RESET' });
    expect(reset).toEqual(initialState);
  });

  describe('RELAYOUT', () => {
    it('is a no-op when the trayMode is unchanged', () => {
      const state = start(1, 'below');
      const relayouted = reducer(state, { type: 'RELAYOUT', trayMode: 'below' });
      expect(relayouted).toBe(state);
    });

    it('is a no-op before a game has started', () => {
      const relayouted = reducer(initialState, { type: 'RELAYOUT', trayMode: 'side' });
      expect(relayouted).toBe(initialState);
    });

    it('remaps unlocked pieces from the old tray rect into the new one, leaving locked pieces untouched', () => {
      let state = start(1, 'below');
      // Lock one piece so we can confirm RELAYOUT leaves it alone.
      state = reducer(state, { type: 'PICK_UP', row: 0, col: 0 });
      state = reducer(state, { type: 'DROP', row: 0, col: 0, xFrac: 0, yFrac: 0, snapped: true });
      const lockedBefore = state.positions![0][0];

      const relayouted = reducer(state, { type: 'RELAYOUT', trayMode: 'side' });
      expect(relayouted.trayMode).toBe('side');
      expect(relayouted.positions![0][0]).toEqual(lockedBefore);

      const belowRect = getTrayRect('below');
      const sideRect = getTrayRect('side');
      for (let r = 0; r < DIFFICULTIES.easy.rows; r++) {
        for (let c = 0; c < DIFFICULTIES.easy.cols; c++) {
          if (r === 0 && c === 0) continue;
          const before = state.positions![r][c];
          const after = relayouted.positions![r][c];
          // Every remapped piece must land inside the new rect.
          expect(after.xFrac).toBeGreaterThanOrEqual(sideRect.x0);
          expect(after.xFrac).toBeLessThanOrEqual(sideRect.x1);
          expect(after.yFrac).toBeGreaterThanOrEqual(sideRect.y0);
          expect(after.yFrac).toBeLessThanOrEqual(sideRect.y1);

          const expectedX =
            sideRect.x0 +
            (Math.min(Math.max((before.xFrac - belowRect.x0) / (belowRect.x1 - belowRect.x0), 0), 1)) *
              (sideRect.x1 - sideRect.x0);
          const expectedY =
            sideRect.y0 +
            (Math.min(Math.max((before.yFrac - belowRect.y0) / (belowRect.y1 - belowRect.y0), 0), 1)) *
              (sideRect.y1 - sideRect.y0);
          expect(after.xFrac).toBeCloseTo(expectedX, 10);
          expect(after.yFrac).toBeCloseTo(expectedY, 10);
        }
      }
    });
  });
});
