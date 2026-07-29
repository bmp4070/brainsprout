import { forwardRef, useMemo } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Placement, Puzzle, Tri } from '../lib/types';
import { triKey } from '../lib/types';
import { triPolygon } from '../lib/tri';
import { blockColorHex, blockColorName } from '../palette';
import styles from './Board.module.css';

/** A live drag preview: the piece's oriented tris snapped to a board cell. */
export interface BoardPreview {
  tris: Tri[];
  valid: boolean;
}

export interface BoardProps {
  puzzle: Puzzle;
  /** triKey -> pieceId for every currently-covered region tri. */
  occupied: Record<string, number>;
  hint: Placement | null;
  preview: BoardPreview | null;
  disabled: boolean;
  onPickup: (pieceId: number) => void;
}

function polyPoints(tri: Tri): string {
  return triPolygon(tri)
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
}

/**
 * The backdrop silhouette the kid fills in, rendered as an SVG of atomic
 * triangles (viewBox 0 0 cols rows, 1 unit per grid cell — see lib/tri.ts).
 * Forwards its ref to the <svg> root so the game screen can read
 * getBoundingClientRect() to convert drag pointer positions into cells.
 */
const Board = forwardRef<SVGSVGElement, BoardProps>(function Board(
  { puzzle, occupied, hint, preview, disabled, onPickup },
  ref,
) {
  const { rows, cols, region, pieces } = puzzle;

  const colorByPieceId = useMemo(() => {
    const map = new Map<number, number>();
    for (const piece of pieces) map.set(piece.id, piece.colorIndex);
    return map;
  }, [pieces]);

  const hintKeys = useMemo(() => {
    if (!hint) return new Set<string>();
    return new Set(hint.tris.map(triKey));
  }, [hint]);

  // The backdrop always contributes all 4 atomic tris of every cell it
  // covers, so the silhouette's outer boundary is exactly the cell-level
  // perimeter — same edge math as a plain square-grid region.
  const perimeterSegments = useMemo(() => {
    const cellSet = new Set(region.map((t) => `${t.r},${t.c}`));
    const segments: [number, number, number, number][] = [];
    for (const key of cellSet) {
      const [r, c] = key.split(',').map(Number);
      if (!cellSet.has(`${r - 1},${c}`)) segments.push([c, r, c + 1, r]); // top
      if (!cellSet.has(`${r},${c + 1}`)) segments.push([c + 1, r, c + 1, r + 1]); // right
      if (!cellSet.has(`${r + 1},${c}`)) segments.push([c, r + 1, c + 1, r + 1]); // bottom
      if (!cellSet.has(`${r},${c - 1}`)) segments.push([c, r, c, r + 1]); // left
    }
    return segments;
  }, [region]);

  const handlePickupKey = (event: ReactKeyboardEvent<SVGPolygonElement>, pieceId: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onPickup(pieceId);
  };

  return (
    <div
      className={styles.wrap}
      style={{ '--board-aspect': cols / rows } as React.CSSProperties}
    >
      <svg
        ref={ref}
        className={styles.board}
        viewBox={`0 0 ${cols} ${rows}`}
        role="img"
        aria-label="Shape outline to fill"
      >
        {region.map((t) => {
          const key = triKey(t);
          const pieceId = occupied[key];
          const isFilled = pieceId !== undefined;
          const colorIndex = isFilled ? colorByPieceId.get(pieceId) ?? 0 : -1;
          const isHinted = hintKeys.has(key);

          const classNames = [styles.tri, isFilled ? styles.filled : styles.slot];
          if (isHinted) classNames.push(styles.hintTri);

          return (
            <polygon
              key={key}
              points={polyPoints(t)}
              className={classNames.join(' ')}
              style={isFilled ? { fill: blockColorHex(colorIndex) } : undefined}
              vectorEffect="non-scaling-stroke"
              tabIndex={isFilled && !disabled ? 0 : undefined}
              role={isFilled ? 'button' : undefined}
              aria-label={
                isFilled ? `${blockColorName(colorIndex)} piece, tap to pick up` : undefined
              }
              onClick={isFilled && !disabled ? () => onPickup(pieceId) : undefined}
              onKeyDown={
                isFilled && !disabled ? (event) => handlePickupKey(event, pieceId) : undefined
              }
            />
          );
        })}

        {perimeterSegments.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={styles.perimeter}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {preview && (
          <g className={preview.valid ? styles.previewValid : styles.previewInvalid}>
            {preview.tris.map((t, i) => (
              <polygon
                key={i}
                points={polyPoints(t)}
                vectorEffect="non-scaling-stroke"
                aria-hidden="true"
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
});

export default Board;
