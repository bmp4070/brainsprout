import type { PointerEvent as ReactPointerEvent } from 'react';
import { ensureAudioReady } from '../../../shared/audio/sounds';
import styles from './RowControl.module.css';

export interface RowControlProps {
  rowing: boolean;
  onRowStart: () => void;
  onRowEnd: () => void;
}

/**
 * The giant "hold to row" control. Uses pointer events (mirroring
 * PieceView.tsx's setPointerCapture pattern) so a finger/mouse dragging off
 * the button while held still reliably fires the release.
 */
export default function RowControl({ rowing, onRowStart, onRowEnd }: RowControlProps) {
  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    ensureAudioReady();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some environments (e.g. jsdom) don't implement pointer capture.
    }
    onRowStart();
  };

  const handlePointerUp = () => {
    onRowEnd();
  };

  return (
    <button
      type="button"
      className={`${styles.button} ${rowing ? styles.held : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-pressed={rowing}
      aria-label="Hold to row"
    >
      <span className={styles.emoji} aria-hidden="true">
        🚣
      </span>
      ROW!
    </button>
  );
}
