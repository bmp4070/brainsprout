import styles from './Hud.module.css';

export interface HudProps {
  found: number;
  total: number;
  shuffleDisabled: boolean;
  hintDisabled: boolean;
  muted: boolean;
  onShuffle: () => void;
  onHint: () => void;
  onToggleMute: () => void;
  onBackToMenu: () => void;
}

export default function Hud({
  found,
  total,
  shuffleDisabled,
  hintDisabled,
  muted,
  onShuffle,
  onHint,
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
        📖 {found}/{total} words
      </span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={onShuffle}
          disabled={shuffleDisabled}
          aria-label="Shuffle letters"
        >
          🔀
        </button>
        <button
          type="button"
          className={styles.hintButton}
          onClick={onHint}
          disabled={hintDisabled}
        >
          💡 Hint
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
