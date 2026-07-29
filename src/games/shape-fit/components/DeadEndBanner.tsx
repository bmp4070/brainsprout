import styles from './DeadEndBanner.module.css';

export interface DeadEndBannerProps {
  onRestart: () => void;
}

/**
 * Friendly non-modal banner shown when no remaining piece fits anywhere on
 * the board. The board stays visible underneath (unlike CelebrationOverlay)
 * so a kid can see exactly why they're stuck before restarting.
 */
export default function DeadEndBanner({ onRestart }: DeadEndBannerProps) {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.message}>
        😅 That won&apos;t fit anymore! Pick up a piece or restart.
      </span>
      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={onRestart}>
          🔄 Restart
        </button>
      </div>
    </div>
  );
}
