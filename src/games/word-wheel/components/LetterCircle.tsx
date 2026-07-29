import { useMemo, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ensureAudioReady } from '../../../shared/audio/sounds';
import styles from './LetterCircle.module.css';

export interface LetterCircleProps {
  /** Current (possibly shuffled) letter order — Puzzle.letters. */
  letters: string[];
  /** Indices into `letters`, in selection order. */
  selection: number[];
  lastResult: 'none' | 'correct' | 'already' | 'invalid';
  onAddLetter: (index: number) => void;
  onSubmit: () => void;
  onBackspace: () => void;
  onClear: () => void;
}

/** Logical coordinate space the tiles/line are laid out in; positions are
 * expressed as percentages of the (square, responsive) container so this
 * constant only affects the math below, not real pixels. */
const VIEW_SIZE = 320;
const CENTER = VIEW_SIZE / 2;
const CIRCLE_RADIUS = 118;
/** Max distance (in VIEW_SIZE units) a pointer can be from a tile center
 * and still "hit" it during a drag. */
const HIT_RADIUS = 40;

function tilePosition(index: number, count: number): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / count) * 2 * Math.PI;
  return {
    x: CENTER + CIRCLE_RADIUS * Math.cos(angle),
    y: CENTER + CIRCLE_RADIUS * Math.sin(angle),
  };
}

export default function LetterCircle({
  letters,
  selection,
  lastResult,
  onAddLetter,
  onSubmit,
  onBackspace,
  onClear,
}: LetterCircleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Drag-session bookkeeping, kept in refs so pointermove (which can fire
  // many times before React re-renders with the updated `selection` prop)
  // never double-adds a tile it already added this session.
  const dragActiveRef = useRef(false);
  const dragMovedRef = useRef(false);
  const lastHitRef = useRef<number | null>(null);
  const visitedRef = useRef<Set<number>>(new Set());

  const positions = useMemo(
    () => letters.map((_, i) => tilePosition(i, letters.length)),
    [letters],
  );

  const word = selection.map((i) => letters[i] ?? '').join('');

  const linePoints = selection.map((i) => positions[i]).filter(Boolean);
  const polyline = linePoints.map((p) => `${p.x},${p.y}`).join(' ');

  const bannerClass =
    lastResult === 'correct'
      ? styles.bannerCorrect
      : lastResult === 'invalid'
        ? styles.bannerInvalid
        : lastResult === 'already'
          ? styles.bannerAlready
          : styles.bannerNeutral;

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    ensureAudioReady();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some environments (e.g. jsdom) don't implement pointer capture.
    }
    dragMovedRef.current = false;
    lastHitRef.current = index;
    visitedRef.current = new Set(selection);

    const lastSelected = selection.length > 0 ? selection[selection.length - 1] : null;
    if (lastSelected === index) {
      // Re-tapping the current last letter is the "separate submit path" for
      // words built one tap at a time: a stationary tap only adds a letter
      // (see handlePointerUp below), so tapping the last tile again confirms
      // the word, mirroring how a drag's pointerup confirms it.
      dragActiveRef.current = false;
      onSubmit();
      return;
    }
    if (visitedRef.current.has(index)) {
      // Letter already used elsewhere in the current word; ignore the tap.
      dragActiveRef.current = false;
      return;
    }
    dragActiveRef.current = true;
    visitedRef.current.add(index);
    onAddLetter(index);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!dragActiveRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const localX = ((event.clientX - rect.left) / rect.width) * VIEW_SIZE;
    const localY = ((event.clientY - rect.top) / rect.height) * VIEW_SIZE;

    let bestIndex = -1;
    let bestDist = HIT_RADIUS;
    positions.forEach((pos, idx) => {
      const dist = Math.hypot(pos.x - localX, pos.y - localY);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = idx;
      }
    });

    if (bestIndex === -1 || bestIndex === lastHitRef.current) return;
    lastHitRef.current = bestIndex;
    if (visitedRef.current.has(bestIndex)) return;
    dragMovedRef.current = true;
    visitedRef.current.add(bestIndex);
    onAddLetter(bestIndex);
  }

  function handlePointerUp() {
    // Only a drag that actually traversed to another tile auto-submits; a
    // plain stationary tap leaves the word open for the next tap (see
    // handlePointerDown's re-tap-to-submit path above).
    if (dragActiveRef.current && dragMovedRef.current) {
      onSubmit();
    }
    dragActiveRef.current = false;
    dragMovedRef.current = false;
    lastHitRef.current = null;
  }

  return (
    <div className={styles.wrap}>
      <div className={`${styles.banner} ${bannerClass}`}>
        {word || <span className={styles.placeholder}>Spell a word…</span>}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.smallButton}
          onClick={onBackspace}
          disabled={selection.length === 0}
          aria-label="Remove last letter"
        >
          ⌫
        </button>
        <button
          type="button"
          className={styles.smallButton}
          onClick={onClear}
          disabled={selection.length === 0}
          aria-label="Clear selection"
        >
          ✕
        </button>
      </div>
      <div ref={containerRef} className={styles.circle}>
        <svg
          className={styles.lineOverlay}
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {linePoints.length > 1 && (
            <polyline
              points={polyline}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        {letters.map((letter, index) => {
          const pos = positions[index];
          const isSelected = selection.includes(index);
          return (
            <button
              key={index}
              type="button"
              className={`${styles.tile} ${isSelected ? styles.tileSelected : ''}`}
              style={{
                left: `${(pos.x / VIEW_SIZE) * 100}%`,
                top: `${(pos.y / VIEW_SIZE) * 100}%`,
              }}
              onPointerDown={(e) => handlePointerDown(e, index)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
