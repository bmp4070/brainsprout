import styles from './Hud.module.css';

export interface HudProps {
  picked: number;
  stopCount: number;
  clearDisabled: boolean;
  muted: boolean;
  onClear: () => void;
  onToggleMute: () => void;
  onBackToMenu: () => void;
}

export default function Hud({
  picked,
  stopCount,
  clearDisabled,
  muted,
  onClear,
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
        🧒 {picked} / {stopCount} picked up
      </span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.clearButton}
          onClick={onClear}
          disabled={clearDisabled}
        >
          ↩️ Clear
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
