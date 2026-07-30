import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Difference, Scene } from '../lib/types';
import { ITEM_SPECS } from '../lib/items';
import SceneItemView from './SceneItemView';
import styles from './SceneView.module.css';

export interface SceneViewProps {
  scene: Scene;
  palette: string[];
  skyColor: string;
  groundColor: string;
  /** All of the puzzle's differences, so found/hint markers can be positioned. */
  differences: Difference[];
  /** Ids of differences found so far (shared across both images). */
  found: string[];
  /** Id of the difference currently being flashed by a hint, or null. */
  hint: string | null;
  /** Last wrong-tap location in scene coords, or null. */
  lastMiss: { x: number; y: number } | null;
  /** Bumped on every wrong tap so the "nope" animation restarts even on a repeat spot. */
  missSeq: number;
  onTapScene: (x: number, y: number) => void;
  /** Accessible label distinguishing the two images (e.g. "Picture A"). */
  label: string;
}

const SKY_HEIGHT = 55;

/** One of the two nearly-identical pictures. Converts taps to 0..100 scene coords. */
export default function SceneView({
  scene,
  palette,
  skyColor,
  groundColor,
  differences,
  found,
  hint,
  lastMiss,
  missSeq,
  onTapScene,
  label,
}: SceneViewProps) {
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      onTapScene(x, y);
    },
    [onTapScene],
  );

  const sortedItems = [...scene.items].sort((a, b) => {
    const bottomA = a.y + ITEM_SPECS[a.kind].h * a.scale;
    const bottomB = b.y + ITEM_SPECS[b.kind].h * b.scale;
    return bottomA - bottomB;
  });

  const foundSet = new Set(found);
  const foundDifferences = differences.filter((d) => foundSet.has(d.id));
  const hintDifference = hint !== null ? differences.find((d) => d.id === hint) ?? null : null;

  return (
    <div className={styles.frame}>
      <svg
        className={styles.svg}
        viewBox="0 0 100 100"
        role="img"
        aria-label={label}
        onPointerDown={handlePointerDown}
      >
        <rect x={0} y={0} width={100} height={SKY_HEIGHT} fill={skyColor} />
        <rect x={0} y={SKY_HEIGHT} width={100} height={100 - SKY_HEIGHT} fill={groundColor} />
        {sortedItems.map((item) => (
          <SceneItemView key={item.id} item={item} palette={palette} />
        ))}
        {foundDifferences.map((d) => (
          <circle
            key={d.id}
            className={styles.foundMarker}
            cx={d.cx}
            cy={d.cy}
            r={d.radius}
            fill="none"
          />
        ))}
        {hintDifference && (
          <circle
            key={`hint-${hintDifference.id}`}
            className={styles.hintMarker}
            cx={hintDifference.cx}
            cy={hintDifference.cy}
            r={hintDifference.radius}
            fill="none"
          />
        )}
        {lastMiss && (
          // Positioning lives on this OUTER <g>'s transform ATTRIBUTE; the shake
          // animation below applies a CSS `transform` to the INNER <g> instead of
          // this one, because a CSS transform on an SVG element entirely replaces
          // (rather than composes with) its transform attribute in browsers.
          <g transform={`translate(${lastMiss.x} ${lastMiss.y})`}>
            <g key={missSeq} className={styles.missMark}>
              <line x1={-3} y1={-3} x2={3} y2={3} />
              <line x1={3} y1={-3} x2={-3} y2={3} />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
