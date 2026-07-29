import styles from './Hud.module.css';

export interface HudProps {
  questionNumber: number;
  total: number;
  streak: number;
  muted: boolean;
  onToggleMute: () => void;
  onBackToMenu: () => void;
}

export default function Hud({
  questionNumber,
  total,
  streak,
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
        ❓ {questionNumber} / {total}
      </span>
      <span className={styles.stat}>🔥 {streak}</span>
      <button
        type="button"
        className={styles.iconButton}
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
