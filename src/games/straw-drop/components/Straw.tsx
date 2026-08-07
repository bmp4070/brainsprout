export interface StrawProps {
  /** Width and height in the parent SVG's units. */
  widthUnits?: number;
  heightUnits?: number;
}

const INK = '#2c2340';

/**
 * A classic red-and-white striped straw, drawn top-down in a local box the
 * caller scales/positions. Reused for the hanging straw, the falling straw, and
 * the straw resting in a filled bottle.
 */
export default function Straw({ widthUnits = 2, heightUnits = 14 }: StrawProps) {
  const stripes = Math.ceil(heightUnits / 2);
  return (
    <g>
      {Array.from({ length: stripes }, (_, i) => (
        <rect
          key={i}
          x={0}
          y={i * 2}
          width={widthUnits}
          height={2}
          fill={i % 2 === 0 ? '#ff5a6a' : '#ffffff'}
        />
      ))}
      <rect
        x={0}
        y={0}
        width={widthUnits}
        height={heightUnits}
        rx={widthUnits / 2}
        fill="none"
        stroke={INK}
        strokeWidth={0.25}
      />
    </g>
  );
}
