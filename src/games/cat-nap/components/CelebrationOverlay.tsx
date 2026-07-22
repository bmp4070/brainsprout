import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import BigButton from '../../../shared/components/BigButton';
import { playFanfare } from '../../../shared/audio/sounds';
import CatSprite from './CatSprite';
import styles from './CelebrationOverlay.module.css';

export interface CelebrationOverlayProps {
  elapsedMs: number;
  score: number;
  isNewBest: boolean;
  showTime: boolean;
  /** Number of regions (and napping cats) in the completed puzzle. */
  catCount: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function CelebrationOverlay({
  elapsedMs,
  score,
  isNewBest,
  showTime,
  catCount,
  onPlayAgain,
  onHome,
}: CelebrationOverlayProps) {
  const celebratedRef = useRef(false);
  useEffect(() => {
    // Guard against StrictMode's dev-only double effect invocation so the
    // fanfare and confetti fire once, matching production.
    if (celebratedRef.current) return;
    celebratedRef.current = true;
    playFanfare();
    const colors = ['#ff6b6b', '#ffb84d', '#ffe66d', '#4ecdc4', '#6a89ff', '#d97bff'];
    void confetti({ particleCount: 90, spread: 70, origin: { x: 0.25, y: 0.6 }, colors });
    void confetti({ particleCount: 90, spread: 70, origin: { x: 0.75, y: 0.6 }, colors });
    const timeout = setTimeout(() => {
      void confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 }, colors });
    }, 250);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={styles.catRow} aria-hidden="true">
          {Array.from({ length: catCount }, (_, variant) => (
            <CatSprite key={variant} variant={variant} size={32} />
          ))}
        </div>
        <h2 className={styles.title}>😻 All cats are napping!</h2>
        {showTime && <p className={styles.stat}>⏱️ Time: {formatTime(elapsedMs)}</p>}
        <p className={styles.stat}>🏅 Score: {score}</p>
        {isNewBest && <span className={styles.badge}>🏆 New best score!</span>}
        <div className={styles.actions}>
          <BigButton onClick={onPlayAgain}>🔄 New puzzle</BigButton>
          <BigButton variant="secondary" onClick={onHome}>
            🏠 Home
          </BigButton>
        </div>
      </div>
    </div>
  );
}
