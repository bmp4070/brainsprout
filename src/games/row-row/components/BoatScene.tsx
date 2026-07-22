import styles from './BoatScene.module.css';

export interface BoatSceneProps {
  backgroundUri: string;
  /** 0..1 fraction of the crossing completed. */
  positionFraction: number;
  rowing: boolean;
  segmentType: 'row' | 'rest';
  /** True while the player is rowing during a rest beat (a timing mistake). */
  mistake: boolean;
}

// The boat stays put near the left edge -- like the Chrome dinosaur runner --
// and the world (water ripples + the finish dock) scrolls past it instead.
// That reads as "moving forward" far more clearly than a small boat creeping
// across an otherwise static painted background.
const BOAT_LEFT_PCT = 18;
const WORLD_TRAVEL_PCT = 230;
const DOCK_WORLD_POS_PCT = 258;
// Fixed "world" positions for decorative ripples, spread wide enough that as
// the world scrolls left over the crossing, ripples continuously drift into
// and out of view rather than the water looking frozen.
const RIPPLE_WORLD_POSITIONS: { pos: number; top: number; width: number }[] = [
  { pos: -10, top: 58, width: 9 },
  { pos: 18, top: 74, width: 7 },
  { pos: 42, top: 63, width: 8 },
  { pos: 70, top: 80, width: 6 },
  { pos: 96, top: 60, width: 9 },
  { pos: 125, top: 76, width: 7 },
  { pos: 155, top: 66, width: 8 },
  { pos: 185, top: 82, width: 6 },
  { pos: 215, top: 61, width: 9 },
  { pos: 245, top: 75, width: 7 },
];

/** Simple original geometric Viking longship: curved hull, small prow curl, two oars. */
function BoatArt({ animating }: { animating: boolean }) {
  return (
    <svg className={styles.boatArt} viewBox="0 0 100 60" role="img" aria-label="Viking rowboat">
      <path d="M6,42 Q50,58 94,42 L86,48 Q50,56 14,48 Z" fill="#7a5233" />
      <path d="M8,40 Q50,30 92,40" stroke="#5c3d24" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M86,42 Q98,30 90,16 Q84,26 82,38 Z" fill="#7a5233" />
      <circle cx="90" cy="20" r="4" fill="#c94f4f" />
      <line
        x1="30"
        y1="38"
        x2="10"
        y2={animating ? 20 : 26}
        stroke="#4a3018"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="60"
        y1="38"
        x2="80"
        y2={animating ? 20 : 26}
        stroke="#4a3018"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="34" y="24" width="8" height="14" rx="2" fill="#c94f4f" />
      <rect x="52" y="24" width="8" height="14" rx="2" fill="#f0e0c0" />
    </svg>
  );
}

/** Wooden dock post with a checkered finish flag marking the far shore. */
function FinishDock() {
  return (
    <svg className={styles.goalNet} viewBox="0 0 40 60" role="img" aria-label="Finish dock">
      <rect x="16" y="14" width="4" height="44" fill="#6b4a2b" />
      <rect x="4" y="52" width="32" height="6" rx="2" fill="#8a6238" />
      <g>
        <rect x="20" y="6" width="6" height="6" fill="#2c2340" />
        <rect x="26" y="6" width="6" height="6" fill="#ffffff" />
        <rect x="20" y="12" width="6" height="6" fill="#ffffff" />
        <rect x="26" y="12" width="6" height="6" fill="#2c2340" />
      </g>
    </svg>
  );
}

export default function BoatScene({
  backgroundUri,
  positionFraction,
  rowing,
  segmentType,
  mistake,
}: BoatSceneProps) {
  const clamped = Math.min(Math.max(positionFraction, 0), 1);
  const worldShift = clamped * WORLD_TRAVEL_PCT;
  const dockLeftPct = DOCK_WORLD_POS_PCT - worldShift;
  const animatingRow = rowing && segmentType === 'row' && !mistake;
  const rowCueActive = segmentType === 'row';

  return (
    <div
      className={styles.scene}
      style={{
        backgroundImage: `url("${backgroundUri}")`,
        // A very subtle background-position drift adds depth without
        // implying the distant mountains are actually being crossed.
        backgroundPosition: `${50 - clamped * 8}% 50%`,
      }}
    >
      <div
        className={`${styles.rowCue} ${rowCueActive ? styles.rowCueActive : ''}`}
        aria-hidden="true"
      >
        🥁 ROW!
      </div>
      <div
        className={`${styles.waterBand} ${animatingRow ? styles.flowing : ''}`}
        aria-hidden="true"
      >
        {RIPPLE_WORLD_POSITIONS.map((r) => (
          <div
            key={r.pos}
            className={styles.ripple}
            style={{ left: `${r.pos - worldShift}%`, top: `${r.top}%`, width: `${r.width}%` }}
          />
        ))}
      </div>
      <div className={styles.goal} style={{ left: `${dockLeftPct}%` }} aria-hidden="true">
        <FinishDock />
      </div>
      <div
        className={`${styles.boat} ${animatingRow ? styles.rowing : ''} ${mistake ? styles.mistake : ''}`}
        style={{ left: `${BOAT_LEFT_PCT}%` }}
      >
        <BoatArt animating={animatingRow} />
      </div>
    </div>
  );
}
