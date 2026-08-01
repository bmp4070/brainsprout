import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ItemTile from './ItemTile';
import type { BeltItem } from '../lib/types';
import styles from './ConveyorBelt.module.css';

export interface ConveyorBeltProps {
  belt: BeltItem[];
  /** Target item ids the player has already caught. */
  found: string[];
  /** The most recent wrong-tapped item id + a bump counter, to trigger a shake. */
  lastWrong: string | null;
  wrongSeq: number;
  onTap: (itemId: string) => void;
}

/** Pixels the belt travels per second. Gentle enough for young kids to catch. */
const SPEED_PX_PER_SEC = 70;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export default function ConveyorBelt({ belt, found, lastWrong, wrongSeq, onTap }: ConveyorBeltProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const singleWidthRef = useRef(0);
  const [reduced] = useState(prefersReducedMotion);

  // Briefly mark a wrong-tapped item so every copy of it shakes, then clears.
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  useEffect(() => {
    if (wrongSeq === 0 || lastWrong === null) return;
    setWrongFlash(lastWrong);
    const t = setTimeout(() => setWrongFlash(null), 450);
    return () => clearTimeout(t);
  }, [wrongSeq, lastWrong]);

  // Measure the pitch (tile + gap) between two adjacent tiles so the loop
  // distance is exactly one copy's worth — seamless when we render it twice.
  useLayoutEffect(() => {
    if (reduced) return;
    function measure() {
      const strip = stripRef.current;
      if (!strip || strip.children.length < 2) return;
      const a = strip.children[0] as HTMLElement;
      const b = strip.children[1] as HTMLElement;
      const pitch = b.offsetLeft - a.offsetLeft;
      singleWidthRef.current = pitch * belt.length;
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [belt.length, reduced]);

  // Drive the belt with requestAnimationFrame, writing the transform directly
  // so there's no React re-render per frame.
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      const width = singleWidthRef.current;
      if (width > 0) {
        offsetRef.current = (offsetRef.current + SPEED_PX_PER_SEC * dt) % width;
        if (stripRef.current) {
          stripRef.current.style.transform = `translateX(${-offsetRef.current}px)`;
        }
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const foundSet = new Set(found);
  // Render the sequence twice for a seamless loop (single copy when static).
  const copies = reduced ? belt : [...belt, ...belt];

  function tileState(itemId: string): 'default' | 'found' | 'wrong' {
    if (foundSet.has(itemId)) return 'found';
    if (wrongFlash === itemId) return 'wrong';
    return 'default';
  }

  return (
    <div className={styles.belt} aria-label="Conveyor belt of items — tap the ones you memorized">
      <div className={`${styles.viewport} ${reduced ? styles.static : ''}`}>
        <div className={styles.strip} ref={stripRef}>
          {copies.map((entry, index) => (
            <ItemTile
              key={`${entry.key}-${index < belt.length ? 'a' : 'b'}`}
              itemId={entry.itemId}
              state={tileState(entry.itemId)}
              onTap={onTap}
            />
          ))}
        </div>
      </div>
      <div className={styles.rollerRow} aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={styles.roller} />
        ))}
      </div>
    </div>
  );
}
