import { useEffect, useRef, useState } from 'react';
import { dist, lPath, manhattanDist, routeLength } from '../lib/geometry';
import { GRID_LINES } from '../lib/grid';
import type { Layout, Point, Stop } from '../lib/types';
import { playTick } from '../../../shared/audio/sounds';
import styles from './TownMap.module.css';

export type MapPhase = 'planning' | 'driving' | 'done';

export interface TownMapProps {
  layout: Layout;
  /** Stop ids in pickup order, as tapped so far (may be partial or complete). */
  order: number[];
  phase: MapPhase;
  /** Whether to also draw the robot's optimal route as a dashed overlay. */
  showOptimal: boolean;
  optimalOrder: number[] | null;
  onTapStop: (id: number) => void;
  /** Called once, when the drive animation finishes. */
  onArrived: () => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';

const ROOF_COLOR_COUNT = 6;
const MIN_DRIVE_MS = 2500;
const MAX_DRIVE_MS = 4000;
// Scales total trip length (map units) into a drive duration, then clamps to
// the target 2.5-4s band -- short easy routes land near the low end, long
// hard routes near the high end.
const DRIVE_MS_PER_UNIT = 18;

// Decorative trees sit at block centers (coordinates ~= 5 mod 10), which
// keeps them off every road/intersection by construction. Any candidate too
// close to the school or a house is dropped below.
const TREE_CANDIDATES: Point[] = [
  { x: 15, y: 15 },
  { x: 85, y: 25 },
  { x: 15, y: 65 },
  { x: 75, y: 45 },
  { x: 35, y: 75 },
];
const TREE_MIN_CLEARANCE = 8;
const MAX_TREES = 3;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Concatenates the axis-aligned corner path across a sequence of stations
 * (school -> stop -> stop -> ... ), without duplicating the shared endpoint
 * between consecutive legs. */
function buildCornerPath(stations: Point[]): Point[] {
  if (stations.length === 0) return [];
  const result: Point[] = [stations[0]];
  for (let i = 0; i < stations.length - 1; i++) {
    const leg = lPath(stations[i], stations[i + 1]);
    result.push(...leg.slice(1));
  }
  return result;
}

function directionOf(a: Point, b: Point): Direction {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'down' : 'up';
}

/** Point (and current travel direction) at `fraction` (0..1) along the
 * corner-path polyline `points`. Every segment of `points` is axis-aligned by
 * construction (see `buildCornerPath`), so Euclidean per-segment length here
 * equals that segment's Manhattan length. */
function pointAndDirectionAtFraction(
  points: Point[],
  fraction: number,
): { point: Point; dir: Direction } {
  if (points.length === 0) return { point: { x: 50, y: 50 }, dir: 'right' };
  if (points.length === 1) return { point: points[0], dir: 'right' };

  const segLengths = points.slice(0, -1).map((p, i) => dist(p, points[i + 1]));
  const total = segLengths.reduce((a, b) => a + b, 0);
  if (total === 0) return { point: points[0], dir: 'right' };

  let target = clamp01(fraction) * total;
  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (target <= segLen || i === segLengths.length - 1) {
      const segFrac = segLen === 0 ? 0 : target / segLen;
      const a = points[i];
      const b = points[i + 1];
      const point = { x: a.x + (b.x - a.x) * segFrac, y: a.y + (b.y - a.y) * segFrac };
      return { point, dir: directionOf(a, b) };
    }
    target -= segLen;
  }
  return { point: points[points.length - 1], dir: 'right' };
}

function polylinePoints(points: Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function ordinalSuffix(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

/** Simple flat house: walls, a colored roof, and a door. */
function HouseIcon({ roofColor }: { roofColor: string }) {
  return (
    <g aria-hidden="true">
      <rect x={-4} y={-2} width={8} height={6} fill="#fff8ec" stroke="#6b6178" strokeWidth={0.4} />
      <polygon points="-5,-2 0,-6.5 5,-2" fill={roofColor} stroke="#2c2340" strokeWidth={0.3} />
      <rect x={-1.2} y={1} width={2.4} height={3} fill="#7a5233" />
    </g>
  );
}

/** Simple flat schoolhouse with a small flagpole. */
function SchoolIcon() {
  return (
    <g aria-hidden="true">
      <rect x={-7} y={-4} width={14} height={9} fill="#fff8ec" stroke="#6b6178" strokeWidth={0.5} />
      <polygon points="-8,-4 0,-10 8,-4" fill="#ff8a3d" stroke="#2c2340" strokeWidth={0.4} />
      <rect x={-2} y={1.5} width={4} height={3.5} fill="#5e35d6" />
      <line x1={0} y1={-10} x2={0} y2={-14} stroke="#6b4a2b" strokeWidth={0.5} />
      <polygon points="0,-14 4,-12.5 0,-11" fill="#ef5350" />
    </g>
  );
}

/** Small decorative tree: trunk + canopy. */
function TreeIcon({ at }: { at: Point }) {
  return (
    <g transform={`translate(${at.x}, ${at.y})`} aria-hidden="true">
      <rect x={-0.7} y={0} width={1.4} height={3} fill="#6b4a2b" />
      <circle cx={0} cy={-1} r={3.2} fill="#4a9d5f" />
    </g>
  );
}

/** Rotation/flip transform so the bus glyph faces its current travel
 * direction. The emoji's default orientation is treated as facing left, so
 * 'left' is the identity transform; the others are a scaleX flip and/or a
 * 90-degree rotation, per direction. */
function busTransform(dir: Direction): string {
  switch (dir) {
    case 'left':
      return '';
    case 'right':
      return 'scale(-1, 1)';
    case 'down':
      return 'rotate(90) scale(-1, 1)';
    case 'up':
      return 'rotate(-90) scale(-1, 1)';
  }
}

export default function TownMap({
  layout,
  order,
  phase,
  showOptimal,
  optimalOrder,
  onTapStop,
  onArrived,
}: TownMapProps) {
  const stopsById = new Map(layout.stops.map((s) => [s.id, s] as const));
  const [busPos, setBusPos] = useState<Point | null>(null);
  const [busDir, setBusDir] = useState<Direction>('left');

  const rafRef = useRef<number | null>(null);
  const arrivedRef = useRef(false);

  // Drives the bus icon along the full closed tour (school -> order ->
  // school) over one rAF loop, ticking a sound each time it passes a house
  // and calling onArrived once at the end. Only depends on `phase` so the
  // loop is created exactly once per drive and torn down on phase change or
  // unmount; `layout`/`order`/`onArrived` are read from the closure captured
  // at the render where phase became 'driving' and do not change mid-drive.
  useEffect(() => {
    if (phase !== 'driving') {
      setBusPos(null);
      return;
    }

    const stations: Point[] = [
      layout.school,
      ...order.map((id) => stopsById.get(id)).filter((s): s is Stop => Boolean(s)),
      layout.school,
    ];
    const cornerPath = buildCornerPath(stations);
    const length = routeLength(layout.school, layout.stops, order, true);
    const durationMs = Math.min(MAX_DRIVE_MS, Math.max(MIN_DRIVE_MS, length * DRIVE_MS_PER_UNIT));

    // Cumulative Manhattan distance at which the bus reaches each *station*
    // (school departure, each house, school return). Tick timing is driven
    // off this, independent of how many corner waypoints the drawn path
    // happens to have.
    const stationDistances: number[] = [0];
    let acc = 0;
    for (let i = 0; i < stations.length - 1; i++) {
      acc += manhattanDist(stations[i], stations[i + 1]);
      stationDistances.push(acc);
    }

    arrivedRef.current = false;
    let nextTickStation = 1;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const fraction = clamp01(elapsed / durationMs);
      const { point, dir } = pointAndDirectionAtFraction(cornerPath, fraction);
      setBusPos(point);
      setBusDir(dir);

      // Tick once each time the bus's traveled distance crosses into a new
      // station, skipping index 0 (school departure) and the final station
      // (the closing return to school) so only actual house stops chime.
      const traveled = fraction * length;
      while (
        nextTickStation < stationDistances.length - 1 &&
        traveled >= stationDistances[nextTickStation]
      ) {
        playTick(nextTickStation);
        nextTickStation++;
      }

      if (fraction >= 1) {
        if (!arrivedRef.current) {
          arrivedRef.current = true;
          onArrived();
        }
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const tappable = phase === 'planning';
  const routeComplete = order.length === layout.stops.length;

  const tappedStations: Point[] = [
    layout.school,
    ...order.map((id) => stopsById.get(id)).filter((s): s is Stop => Boolean(s)),
  ];
  const tappedPath = buildCornerPath(tappedStations);
  const previewClosingPath =
    phase === 'planning' && routeComplete
      ? lPath(tappedStations[tappedStations.length - 1], layout.school)
      : [];

  const drivenStations: Point[] =
    phase !== 'planning'
      ? [
          layout.school,
          ...order.map((id) => stopsById.get(id)).filter((s): s is Stop => Boolean(s)),
          layout.school,
        ]
      : [];
  const drivenPath = buildCornerPath(drivenStations);

  const optimalStations: Point[] =
    showOptimal && optimalOrder
      ? [
          layout.school,
          ...optimalOrder.map((id) => stopsById.get(id)).filter((s): s is Stop => Boolean(s)),
          layout.school,
        ]
      : [];
  const optimalPath = buildCornerPath(optimalStations);

  const visibleTrees = TREE_CANDIDATES.filter(
    (spot) =>
      dist(spot, layout.school) >= TREE_MIN_CLEARANCE &&
      layout.stops.every((s) => dist(spot, s) >= TREE_MIN_CLEARANCE),
  ).slice(0, MAX_TREES);

  return (
    <div className={styles.wrap}>
      <svg className={styles.svg} viewBox="0 0 100 100" role="img" aria-label="Town map">
        {/* Kid-friendly town background: ground, the street grid, a few trees. */}
        <rect x={0} y={0} width={100} height={100} fill="#d7ecc4" />
        <g aria-hidden="true">
          {GRID_LINES.map((v) => (
            <line
              key={`v-${v}`}
              x1={v}
              y1={0}
              x2={v}
              y2={100}
              stroke="#e8dcc0"
              strokeWidth={1.8}
            />
          ))}
          {GRID_LINES.map((v) => (
            <line
              key={`h-${v}`}
              x1={0}
              y1={v}
              x2={100}
              y2={v}
              stroke="#e8dcc0"
              strokeWidth={1.8}
            />
          ))}
        </g>
        {visibleTrees.map((spot, i) => (
          <TreeIcon key={i} at={spot} />
        ))}

        {phase === 'planning' && (
          <polyline
            points={polylinePoints(tappedPath)}
            fill="none"
            stroke="#ff8a3d"
            strokeOpacity={0.75}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {phase === 'planning' && routeComplete && (
          <polyline
            points={polylinePoints(previewClosingPath)}
            fill="none"
            stroke="#ff8a3d"
            strokeOpacity={0.6}
            strokeWidth={2.2}
            strokeDasharray="3,2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {phase !== 'planning' && (
          <polyline
            points={polylinePoints(drivenPath)}
            fill="none"
            stroke="#ff8a3d"
            strokeOpacity={0.75}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {optimalPath.length > 0 && (
          <polyline
            points={polylinePoints(optimalPath)}
            fill="none"
            stroke="#0e9cb0"
            strokeOpacity={0.85}
            strokeWidth={2}
            strokeDasharray="3,2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        <g transform={`translate(${layout.school.x}, ${layout.school.y})`}>
          <SchoolIcon />
        </g>

        {layout.stops.map((stop) => {
          const orderIndex = order.indexOf(stop.id);
          const picked = orderIndex !== -1;
          const roofColor = `var(--word-color-${stop.id % ROOF_COLOR_COUNT})`;
          const label = picked
            ? `House ${stop.id + 1}, picked up ${orderIndex + 1}${ordinalSuffix(orderIndex + 1)}`
            : `House ${stop.id + 1}, not picked up yet`;
          return (
            <g key={stop.id} transform={`translate(${stop.x}, ${stop.y})`}>
              <HouseIcon roofColor={roofColor} />
              {!picked && (
                <circle
                  cx={0}
                  cy={-8}
                  r={1.3}
                  fill="#ffb84d"
                  stroke="#2c2340"
                  strokeWidth={0.3}
                  aria-hidden="true"
                />
              )}
              {picked && (
                <g aria-hidden="true">
                  <circle cx={4.5} cy={-6} r={2.4} fill="#fff" stroke="#2c2340" strokeWidth={0.3} />
                  <text x={4.5} y={-5.1} fontSize={2.6} textAnchor="middle" fill="#2c2340">
                    {orderIndex + 1}
                  </text>
                </g>
              )}
              <circle
                cx={0}
                cy={0}
                r={7}
                fill="transparent"
                role="button"
                tabIndex={tappable ? 0 : -1}
                aria-label={label}
                className={styles.tapTarget}
                onClick={() => {
                  if (tappable) onTapStop(stop.id);
                }}
                onKeyDown={(event) => {
                  if (tappable && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    onTapStop(stop.id);
                  }
                }}
              />
            </g>
          );
        })}

        {busPos && (
          <g transform={`translate(${busPos.x}, ${busPos.y})`} aria-hidden="true">
            <text
              fontSize={7}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={busTransform(busDir)}
            >
              🚌
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
