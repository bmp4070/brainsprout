import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import BigButton from '../../../shared/components/BigButton';
import { playFanfare, playFound } from '../../../shared/audio/sounds';
import type { SortResult } from '../lib/scoring';
import { POTION_HEX } from '../palette';
import styles from './CelebrationOverlay.module.css';

export interface CelebrationOverlayProps {
  result: SortResult;
  pours: number;
  par: number;
  parExact: boolean;
  isNewBest: boolean;
  onNewGame: () => void;
  onHome: () => void;
}

export default function CelebrationOverlay({
  result,
  pours,
  par,
  parExact,
  isNewBest,
  onNewGame,
  onHome,
}: CelebrationOverlayProps) {
  // Collapsed = card out of the way so the kid can admire the solved shelf;
  // a floating pill reopens it. Local state on purpose: the component stays
  // mounted while collapsed, so the one-shot celebration guard below isn't
  // re-triggered on reopen.
  const [collapsed, setCollapsed] = useState(false);
  const celebratedRef = useRef(false);
  useEffect(() => {
    // Guard against StrictMode's dev-only double effect invocation so the
    // celebration cue fires once, matching production.
    if (celebratedRef.current) return;
    celebratedRef.current = true;

    if (result.stars === 3) {
      playFanfare();
      const colors = [...POTION_HEX];
      void confetti({ particleCount: 90, spread: 70, origin: { x: 0.25, y: 0.6 }, colors });
      void confetti({ particleCount: 90, spread: 70, origin: { x: 0.75, y: 0.6 }, colors });
      const timeout = setTimeout(() => {
        void confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, colors });
      }, 250);
      return () => clearTimeout(timeout);
    }
    // 1-2 star finishes get a lighter cue -- no confetti -- so kids can feel
    // the difference between "great" and "perfect".
    playFound();
  }, [result.stars]);

  if (collapsed) {
    return (
      <button
        type="button"
        className={styles.reopenPill}
        onClick={() => setCollapsed(false)}
        aria-label="Show results"
      >
        ⭐ Results
      </button>
    );
  }

  const parLine = parExact
    ? `You: ${pours} pours · Best possible: ${par}`
    : `You: ${pours} pours · Best possible: about ${par}`;

  return (
    <div className={styles.overlay} role="dialog" aria-label="Potion sort results">
      <div className={styles.card}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={() => setCollapsed(true)}
          aria-label="Close results and view the shelf"
        >
          ✕
        </button>
        <h2 className={styles.title}>🧪✨ All potions sorted!</h2>
        <div className={styles.starRow} aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= result.stars ? styles.starFilled : styles.starDim}>
              ⭐
            </span>
          ))}
        </div>
        <p className={styles.stat}>🏅 Score: {result.score}</p>
        <p className={styles.line}>{parLine}</p>
        {isNewBest && <span className={styles.badge}>🏆 New best!</span>}
        <div className={styles.actions}>
          <BigButton onClick={onNewGame}>🔄 New potions</BigButton>
          <BigButton variant="secondary" onClick={onHome}>
            🏠 Home
          </BigButton>
        </div>
      </div>
    </div>
  );
}
