import type { Tri } from '../lib/types';
import type { TrayPiece as TrayPieceModel } from '../hooks/useShapeFit';
import TrayPieceView from './TrayPiece';
import styles from './PieceTray.module.css';

export interface PieceTrayProps {
  tray: TrayPieceModel[];
  orientedTris: (trayPiece: TrayPieceModel) => Tri[];
  selectedId: number | null;
  draggingId: number | null;
  disabled: boolean;
  onSelect: (pieceId: number) => void;
  onDragStart: (pieceId: number, clientX: number, clientY: number) => void;
  onDragMove: (pieceId: number, clientX: number, clientY: number) => void;
  onDragEnd: (pieceId: number, clientX: number, clientY: number) => void;
}

/** The tray of not-yet-placed pieces, below the board. */
export default function PieceTray({
  tray,
  orientedTris,
  selectedId,
  draggingId,
  disabled,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
}: PieceTrayProps) {
  const unplaced = tray.filter((trayPiece) => trayPiece.placedAt === null);

  if (unplaced.length === 0) {
    return (
      <div className={styles.tray}>
        <span className={styles.empty}>🎉 All pieces placed!</span>
      </div>
    );
  }

  return (
    <div className={styles.tray}>
      {unplaced.map((trayPiece) => (
        <TrayPieceView
          key={trayPiece.piece.id}
          pieceId={trayPiece.piece.id}
          colorIndex={trayPiece.piece.colorIndex}
          tris={orientedTris(trayPiece)}
          selected={selectedId === trayPiece.piece.id}
          isDragging={draggingId === trayPiece.piece.id}
          disabled={disabled}
          onSelect={onSelect}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}
