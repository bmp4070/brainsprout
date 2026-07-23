import styles from './Hud.module.css';

export interface HudProps {
  completed: number;
  colorCount: number;
  pours: number;
  undoDisabled: boolean;
  hintDisabled: boolean;
  muted: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onHint: () => void;
  onToggleMute: () => void;
  onBackToMenu: () => void;
}

export default function Hud({
  completed,
  colorCount,
  pours,
  undoDisabled,
  hintDisabled,
  muted,
  onUndo,
  onRestart,
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
        🧪 {completed}/{colorCount} pure
      </span>
      <span className={styles.stat}>💧 {pours}</span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={onUndo}
          disabled={undoDisabled}
        >
          ↩️ Undo
        </button>
        <button type="button" className={styles.actionButton} onClick={onRestart}>
          🔄 Restart
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
