import Straw from './Straw';
import styles from './Bottle.module.css';

export interface BottleProps {
  colorHex: string;
  /** Catch half-width in field units; the drawn opening is twice this. */
  mouthTolerance: number;
  filled: boolean;
}

// The bottle is authored in a 0..16 wide viewBox (matching BOTTLE_WIDTH field
// units), so `mouthTolerance` maps 1:1 to the SVG and the hole you see is the
// hole you must hit.
const CX = 8;
const INK = '#2c2340';

/** A jar-style bottle with a visible top opening sized by `mouthTolerance`. */
export default function Bottle({ colorHex, mouthTolerance, filled }: BottleProps) {
  const tol = Math.max(1.4, Math.min(6.5, mouthTolerance)); // clamp for drawing
  const leftRimEnd = CX - tol;
  const rightRimStart = CX + tol;
  return (
    <svg className={styles.bottle} viewBox="0 0 16 24" aria-hidden="true">
      {/* glass body */}
      <rect x={1.6} y={5} width={12.8} height={17.5} rx={2.6} fill="#eaf6ff" stroke={INK} strokeWidth={0.4} opacity={0.92} />
      {/* liquid */}
      <rect x={2.4} y={12} width={11.2} height={9.7} rx={1.9} fill={colorHex} />
      <rect x={2.4} y={12} width={11.2} height={2.4} rx={1.2} fill="#ffffff" opacity={0.25} />
      {/* rim caps — the gap between them is the mouth the straw must enter */}
      <rect x={1.4} y={3.8} width={leftRimEnd - 1.4} height={2.6} rx={1.1} fill="#cfe6f5" stroke={INK} strokeWidth={0.35} />
      <rect x={rightRimStart} y={3.8} width={14.6 - rightRimStart} height={2.6} rx={1.1} fill="#cfe6f5" stroke={INK} strokeWidth={0.35} />
      {/* a straw resting inside once filled */}
      {filled && (
        <g transform="translate(6.6 -3) rotate(8 1.4 10)">
          <Straw widthUnits={1.6} heightUnits={13} />
        </g>
      )}
    </svg>
  );
}
