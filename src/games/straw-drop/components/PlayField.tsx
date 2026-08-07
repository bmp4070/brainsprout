import { useCallback, useEffect, useReducer, useRef } from 'react';
import Bottle from './Bottle';
import Straw from './Straw';
import { advanceBottles, findHit, pruneBottles, shouldSpawn } from '../lib/engine';
import type { Bottle as BottleModel, DifficultyConfig } from '../lib/types';
import {
  BOTTLE_MOUTH_Y,
  BOTTLE_WIDTH,
  DROP_X,
  SPAWN_X,
  STRAW_TOP_Y,
} from '../lib/types';
import styles from './PlayField.module.css';

export interface PlayFieldProps {
  difficulty: DifficultyConfig;
  /** True while the round is live; false pauses the loop (menu / won). */
  playing: boolean;
  onHit: () => void;
  onMiss: () => void;
}

const BOTTLE_COLORS = ['#ff6b6b', '#ffb84d', '#ffe066', '#4ecdc4', '#6a89ff', '#d97bff', '#7ac74f'];
const COOLDOWN_MS = 320;

type StrawPhase = 'ready' | 'falling' | 'cooldown';

/**
 * The live belt: bottles scroll right→left, a striped straw hangs at the drop
 * point, and space / tap releases it. A requestAnimationFrame loop advances the
 * belt and the falling straw (all in field units 0..100); when the straw
 * reaches the bottle mouths it reports a hit or a miss upstream. Positions live
 * in refs and the loop bumps a render tick, so React isn't the source of truth
 * for physics.
 */
export default function PlayField({ difficulty, playing, onHit, onMiss }: PlayFieldProps) {
  const [, forceTick] = useReducer((n: number) => n + 1, 0);

  const bottlesRef = useRef<BottleModel[]>([]);
  const nextIdRef = useRef(0);
  const strawRef = useRef<{ phase: StrawPhase; y: number; until: number }>({
    phase: 'ready',
    y: STRAW_TOP_Y,
    until: 0,
  });
  const lastFrameRef = useRef(0);

  const fallSpeed = (BOTTLE_MOUTH_Y - STRAW_TOP_Y) / difficulty.fallSeconds;

  const drop = useCallback(() => {
    if (!playing) return;
    if (strawRef.current.phase === 'ready') {
      strawRef.current = { phase: 'falling', y: STRAW_TOP_Y, until: 0 };
    }
  }, [playing]);

  // Space bar releases the straw (and never scrolls the page).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        drop();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drop]);

  // The animation loop.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    lastFrameRef.current = performance.now();

    const step = (dt: number, now: number) => {
      // Belt: move, prune, and top up with new bottles.
      let bottles = pruneBottles(advanceBottles(bottlesRef.current, difficulty.beltSpeed, dt));
      if (shouldSpawn(bottles, SPAWN_X, difficulty.gap)) {
        bottles = [
          ...bottles,
          {
            id: nextIdRef.current++,
            x: SPAWN_X,
            colorIndex: nextIdRef.current % BOTTLE_COLORS.length,
            filled: false,
          },
        ];
      }
      bottlesRef.current = bottles;

      // Straw.
      const straw = strawRef.current;
      if (straw.phase === 'falling') {
        const y = straw.y + fallSpeed * dt;
        if (y >= BOTTLE_MOUTH_Y) {
          const hitId = findHit(bottlesRef.current, difficulty.mouthTolerance);
          if (hitId !== null) {
            bottlesRef.current = bottlesRef.current.map((b) =>
              b.id === hitId ? { ...b, filled: true } : b,
            );
            onHit();
          } else {
            onMiss();
          }
          strawRef.current = { phase: 'cooldown', y: BOTTLE_MOUTH_Y, until: now + COOLDOWN_MS };
        } else {
          strawRef.current = { ...straw, y };
        }
      } else if (straw.phase === 'cooldown' && now >= straw.until) {
        strawRef.current = { phase: 'ready', y: STRAW_TOP_Y, until: 0 };
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;
      step(dt, now);
      forceTick();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, difficulty, fallSpeed, onHit, onMiss]);

  const straw = strawRef.current;

  return (
    <div className={styles.wrap}>
    <div
      className={styles.field}
      onPointerDown={drop}
      role="button"
      tabIndex={0}
      aria-label="Play field — press Space or tap to drop the straw"
    >
      {/* drop guide line */}
      <div className={styles.guide} style={{ left: `${DROP_X}%` }} aria-hidden="true" />

      {/* bottles */}
      {bottlesRef.current.map((b) => (
        <div
          key={b.id}
          className={styles.bottle}
          style={{ left: `${b.x}%`, top: `${BOTTLE_MOUTH_Y}%`, width: `${BOTTLE_WIDTH}%` }}
        >
          <Bottle colorHex={BOTTLE_COLORS[b.colorIndex]} mouthTolerance={difficulty.mouthTolerance} filled={b.filled} />
        </div>
      ))}

      {/* the straw (hanging or falling) */}
      {straw.phase !== 'cooldown' && (
        <div
          className={styles.straw}
          style={{ left: `${DROP_X}%`, top: `${straw.y}%` }}
        >
          <svg viewBox="0 0 2 16" className={styles.strawSvg} aria-hidden="true">
            <Straw widthUnits={2} heightUnits={16} />
          </svg>
        </div>
      )}

      {/* belt */}
      <div className={styles.belt} aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <span key={i} className={styles.beltTooth} />
        ))}
      </div>
    </div>
      <button type="button" className={styles.dropButton} onClick={drop}>
        ⬇️ Drop! <span className={styles.dropHint}>(Space)</span>
      </button>
    </div>
  );
}
