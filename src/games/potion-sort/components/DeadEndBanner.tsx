import styles from './DeadEndBanner.module.css';

export interface DeadEndBannerProps {
  onUndo: () => void;
  onRestart: () => void;
  canUndo: boolean;
}

/**
 * Friendly non-modal banner shown when no legal pour remains. The shelf stays
 * visible underneath (unlike CelebrationOverlay) so a kid can see exactly why
 * they're stuck before undoing or restarting.
 */
export default function DeadEndBanner({ onUndo, onRestart, canUndo }: DeadEndBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.message}>😅 No more pours possible! Undo a move or start fresh.</span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={onUndo}
          disabled={!canUndo}
        >
          ↩️ Undo
        </button>
        <button type="button" className={styles.actionButton} onClick={onRestart}>
          🔄 Restart
        </button>
      </div>
    </div>
  );
}
