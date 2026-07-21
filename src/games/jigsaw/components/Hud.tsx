import styles from './Hud.module.css';

export interface HudProps {
  sceneTitle: string;
  sceneEmoji: string;
  lockedCount: number;
  totalCount: number;
  elapsedMs: number;
  timerEnabled: boolean;
  muted: boolean;
  /** When provided, shows a 💡 button that flashes the picture briefly. */
  onHint?: () => void;
  hintActive?: boolean;
  onToggleMute: () => void;
  onBackToMenu: () => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Hud({
  sceneTitle,
  sceneEmoji,
  lockedCount,
  totalCount,
  elapsedMs,
  timerEnabled,
  muted,
  onHint,
  hintActive = false,
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
        {sceneEmoji} {sceneTitle}
      </span>
      <span className={styles.stat}>
        🧩 {lockedCount} / {totalCount}
      </span>
      {timerEnabled && <span className={styles.stat}>⏱️ {formatTime(elapsedMs)}</span>}
      <div className={styles.actions}>
        {onHint && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onHint}
            disabled={hintActive}
            aria-label="Peek at the picture"
          >
            💡
          </button>
        )}
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
