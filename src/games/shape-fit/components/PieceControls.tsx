import styles from './PieceControls.module.css';

export interface PieceControlsProps {
  disabled: boolean;
  onRotate: () => void;
  onFlip: () => void;
}

/** Big rotate/flip buttons that act on the currently-selected tray piece. */
export default function PieceControls({ disabled, onRotate, onFlip }: PieceControlsProps) {
  return (
    <div className={styles.controls}>
      <button
        type="button"
        className={styles.button}
        onClick={onRotate}
        disabled={disabled}
        aria-label="Rotate selected block"
      >
        🔄 Rotate
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={onFlip}
        disabled={disabled}
        aria-label="Flip selected block"
      >
        ↔️ Flip
      </button>
    </div>
  );
}
