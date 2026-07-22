import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import BigButton from '../../../shared/components/BigButton';
import { playFanfare, playFound } from '../../../shared/audio/sounds';
import type { RouteResult } from '../lib/scoring';
import styles from './CelebrationOverlay.module.css';

export interface CelebrationOverlayProps {
  result: RouteResult;
  isNewBest: boolean;
  showOptimal: boolean;
  onToggleOptimal: () => void;
  onNewRoute: () => void;
  onHome: () => void;
}

const STAR_LINES: Record<1 | 2 | 3, string> = {
  3: 'Perfect route! The robot is impressed!',
  2: 'Great driving! Can you find an even shorter way?',
  1: 'Everyone got to school! Try a shorter route for more stars!',
};

export default function CelebrationOverlay({
  result,
  isNewBest,
  showOptimal,
  onToggleOptimal,
  onNewRoute,
  onHome,
}: CelebrationOverlayProps) {
  const celebratedRef = useRef(false);
  useEffect(() => {
    // Guard against StrictMode's dev-only double effect invocation so the
    // celebration cue fires once, matching production.
    if (celebratedRef.current) return;
    celebratedRef.current = true;

    if (result.stars === 3) {
      playFanfare();
      const colors = ['#ff6b6b', '#ffb84d', '#ffe66d', '#4ecdc4', '#6a89ff', '#d97bff'];
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

  return (
    <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Route results">
      <div className={styles.starRow} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= result.stars ? styles.starFilled : styles.starDim}>
            ⭐
          </span>
        ))}
      </div>
      <p className={styles.stat}>🏅 Score: {result.score}</p>
      {isNewBest && <span className={styles.badge}>🏆 New best!</span>}
      <p className={styles.line}>{STAR_LINES[result.stars]}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.ghostButton} onClick={onToggleOptimal}>
          {showOptimal ? '🤖 Hide shortest route' : '🤖 Show shortest route'}
        </button>
      </div>
      <div className={styles.actions}>
        <BigButton onClick={onNewRoute}>🔄 New route</BigButton>
        <BigButton variant="secondary" onClick={onHome}>
          🏠 Home
        </BigButton>
      </div>
    </div>
  );
}
