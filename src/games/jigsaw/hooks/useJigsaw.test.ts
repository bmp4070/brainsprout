import { describe, expect, it } from 'vitest';
import { reducer, initialState } from './useJigsaw';
import type { JigsawState } from './useJigsaw';
import { DIFFICULTIES, pieceCount } from '../lib/types';
import { scenes } from '../scenes';

const scene = scenes[0];

function start(seed = 1): JigsawState {
  return reducer(initialState, {
    type: 'START',
    difficulty: DIFFICULTIES.easy,
    scene,
    seed,
    now: 1000,
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

  it('is deterministic for a given seed', () => {
    expect(start(7)).toEqual(start(7));
  });

  it('picks up an unlocked piece', () => {
    const playing = start();
    const picked = reducer(playing, { type: 'PICK_UP', row: 0, col: 0 });
    expect(picked.dragging).toEqual({ row: 0, col: 0 });
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
});
