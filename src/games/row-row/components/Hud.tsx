import styles from './Hud.module.css';

export interface HudProps {
  sceneTitle: string;
  sceneEmoji: string;
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

// No progress bar here -- the boat crossing the fjord in BoatScene already
// shows crossing progress: it glides forward on a correct beat and stalls
// or slips back on a mistimed one. A second indicator would be redundant.
export default function Hud({
  sceneTitle,
  sceneEmoji,
  elapsedMs,
  timerEnabled,
  muted,
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
