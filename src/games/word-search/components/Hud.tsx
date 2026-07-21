import styles from './Hud.module.css';

export interface HudProps {
  themeTitle: string;
  themeEmoji: string;
  foundCount: number;
  totalCount: number;
  elapsedMs: number;
  timerEnabled: boolean;
  muted: boolean;
  onHint: () => void;
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
  themeTitle,
  themeEmoji,
  foundCount,
  totalCount,
  elapsedMs,
  timerEnabled,
  muted,
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
        {themeEmoji} {themeTitle}
      </span>
      <span className={styles.stat}>
        ⭐ {foundCount} / {totalCount}
      </span>
      {timerEnabled && <span className={styles.stat}>⏱️ {formatTime(elapsedMs)}</span>}
      <div className={styles.actions}>
        <button type="button" className={styles.hintButton} onClick={onHint}>
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
