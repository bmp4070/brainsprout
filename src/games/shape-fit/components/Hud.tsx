import styles from './Hud.module.css';

export interface HudProps {
  placed: number;
  total: number;
  hintDisabled: boolean;
  muted: boolean;
  onHint: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onBackToMenu: () => void;
}

export default function Hud({
  placed,
  total,
  hintDisabled,
  muted,
  onHint,
  onRestart,
  onToggleMute,
  onBackToMenu,
}: HudProps) {
  return (
    <div className={styles.hud}>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onBackToMenu}
        aria-label="Back to menu"
      >
        🏠
      </button>
      <span className={styles.stat}>
        🔷 {placed}/{total} placed
      </span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.hintButton}
          onClick={onHint}
          disabled={hintDisabled}
        >
          💡 Hint
        </button>
        <button type="button" className={styles.actionButton} onClick={onRestart}>
          🔄 Restart
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
}
