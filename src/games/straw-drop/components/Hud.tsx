import styles from './Hud.module.css';

export interface HudProps {
  filled: number;
  target: number;
  elapsedMs: number;
  timerEnabled: boolean;
  muted: boolean;
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
  filled,
  target,
  elapsedMs,
  timerEnabled,
  muted,
  onToggleMute,
  onBackToMenu,
}: HudProps) {
  return (
    <div className={styles.hud}>
      <button type="button" className={styles.iconButton} onClick={onBackToMenu} aria-label="Back to menu">
        🏠
      </button>
      <span className={styles.stat}>
        🍼 {filled}/{target}
      </span>
      {timerEnabled && <span className={styles.stat}>⏱️ {formatTime(elapsedMs)}</span>}
      <div className={styles.actions}>
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
