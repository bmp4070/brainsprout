import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import BigButton from '../../../shared/components/BigButton';
import { playFanfare, playFound } from '../../../shared/audio/sounds';
import type { HuntResult } from '../lib/scoring';
import styles from './CelebrationOverlay.module.css';

export interface CelebrationOverlayProps {
  result: HuntResult;
  wordsFound: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function CelebrationOverlay({
  result,
  wordsFound,
  isNewBest,
  onPlayAgain,
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
    playFound();
  }, [result.stars]);

  return (
    <div className={styles.overlay} role="dialog" aria-label="Word Hunt results">
      <div className={styles.card}>
        <h2 className={styles.title}>🔤✨ You found {wordsFound} words!</h2>
        <div className={styles.starRow} aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= result.stars ? styles.starFilled : styles.starDim}>
              ⭐
            </span>
          ))}
        </div>
        <p className={styles.stat}>🏅 Score: {result.score}</p>
        {isNewBest && <span className={styles.badge}>🏆 New best!</span>}
        <div className={styles.actions}>
          <BigButton onClick={onPlayAgain}>🔄 New board</BigButton>
          <BigButton variant="secondary" onClick={onHome}>
            🏠 Home
          </BigButton>
        </div>
      </div>
    </div>
  );
}
