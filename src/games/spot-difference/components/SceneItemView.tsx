import type { ReactNode } from 'react';
import type { SceneItem } from '../lib/types';
import { ITEM_SPECS } from '../lib/items';
import { INK, kindColor, shade } from './paletteColor';

export interface SceneItemViewProps {
  item: SceneItem;
  /** Exactly 7 hex colours from the active theme. */
  palette: string[];
}

const HI = 'rgba(255,255,255,0.4)'; // soft highlight for roundness

function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + (Math.PI / 5) * i;
    points.push(`${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`);
  }
  return points.join(' ');
}

function renderSun(w: number, h: number, color: string, dark: string): ReactNode {
  const cx = w / 2;
  const cy = h / 2;
  const bodyR = Math.min(w, h) * 0.31;
  const rayInner = bodyR * 1.08;
  const rayOuter = bodyR * 1.5;
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (Math.PI / 6) * i;
        return (
          <line
            key={i}
            x1={cx + Math.cos(angle) * rayInner}
            y1={cy + Math.sin(angle) * rayInner}
            x2={cx + Math.cos(angle) * rayOuter}
            y2={cy + Math.sin(angle) * rayOuter}
            stroke={color}
            strokeWidth={bodyR * 0.22}
            strokeLinecap="round"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={bodyR} fill={color} stroke={dark} strokeWidth={0.35} />
      <ellipse cx={cx - bodyR * 0.35} cy={cy - bodyR * 0.4} rx={bodyR * 0.4} ry={bodyR * 0.28} fill={HI} />
    </>
  );
}

function renderCloud(color: string, dark: string): ReactNode {
  return (
    <g stroke={dark} strokeWidth={0.28}>
      <ellipse cx={10} cy={7.2} rx={9.3} ry={2.6} fill={color} />
      <ellipse cx={5.8} cy={5} rx={4.2} ry={3.6} fill={color} />
      <ellipse cx={11} cy={3.9} rx={5.2} ry={3.8} fill={color} />
      <ellipse cx={15.5} cy={5.5} rx={3.5} ry={3.1} fill={color} />
      <ellipse cx={9} cy={2.8} rx={2.6} ry={1.4} fill={HI} stroke="none" />
    </g>
  );
}

function renderStar(color: string, dark: string): ReactNode {
  return (
    <>
      <polygon points={starPoints(4, 4, 3.7, 1.6)} fill={color} stroke={dark} strokeWidth={0.3} strokeLinejoin="round" />
      <circle cx={3.3} cy={3.3} r={0.7} fill={HI} />
    </>
  );
}

function renderBalloon(color: string, dark: string): ReactNode {
  return (
    <>
      <path d="M5,11 Q3.6,12.4 5,13.8" stroke={dark} strokeWidth={0.3} fill="none" />
      <polygon points="4.2,9.7 5.8,9.7 5,11" fill={dark} />
      <ellipse cx={5} cy={5} rx={4} ry={5} fill={color} stroke={dark} strokeWidth={0.35} />
      <ellipse cx={3.3} cy={3} rx={1.1} ry={1.9} fill={HI} />
    </>
  );
}

function renderBird(color: string, dark: string): ReactNode {
  return (
    <>
      <ellipse cx={5.5} cy={4} rx={3.6} ry={2.3} fill={color} stroke={dark} strokeWidth={0.28} />
      <path d="M3.2,3.4 Q5.2,1.4 7,3.2 Q5.1,3.9 3.2,3.4 Z" fill={shade(color, 0.82)} />
      <circle cx={8} cy={3} r={1.7} fill={color} stroke={dark} strokeWidth={0.28} />
      <polygon points="9.5,3 10.2,3.4 9.5,3.8" fill="#ff9c3d" stroke={dark} strokeWidth={0.15} />
      <circle cx={8.4} cy={2.6} r={0.42} fill={INK} />
      <circle cx={8.5} cy={2.5} r={0.14} fill="#fff" />
    </>
  );
}

function renderKite(color: string, dark: string): ReactNode {
  return (
    <>
      <path d="M5,9.2 Q6.2,10.3 5,11.1 Q3.8,11.9 5,12.7" stroke={dark} strokeWidth={0.35} fill="none" />
      <polygon points="4.6,10.1 5.6,10.6 4.6,11.1" fill={color} />
      <polygon points="4.2,11.7 5.2,12.2 4.2,12.7" fill={color} />
      <polygon points="5,0.6 9,5 5,9.2 1,5" fill={color} stroke={dark} strokeWidth={0.35} strokeLinejoin="round" />
      <polygon points="5,0.6 9,5 5,5" fill={HI} />
      <line x1={5} y1={0.6} x2={5} y2={9.2} stroke={dark} strokeWidth={0.2} />
      <line x1={1} y1={5} x2={9} y2={5} stroke={dark} strokeWidth={0.2} />
    </>
  );
}

function renderTree(w: number, h: number, color: string, dark: string): ReactNode {
  const trunk = shade('#a06a34', 1);
  return (
    <>
      <rect x={w / 2 - 1.3} y={12.5} width={2.6} height={h - 12.5} rx={0.8} fill={trunk} stroke={shade(trunk, 0.8)} strokeWidth={0.3} />
      <circle cx={8} cy={8.5} r={7} fill={color} stroke={dark} strokeWidth={0.3} />
      <circle cx={4.6} cy={11.6} r={4.8} fill={color} stroke={dark} strokeWidth={0.3} />
      <circle cx={11.4} cy={11.6} r={4.8} fill={color} stroke={dark} strokeWidth={0.3} />
      <circle cx={5.5} cy={6} r={2.2} fill={HI} />
    </>
  );
}

function renderBush(color: string, dark: string): ReactNode {
  return (
    <g stroke={dark} strokeWidth={0.28}>
      <circle cx={3.6} cy={6.4} r={3.8} fill={color} />
      <circle cx={7} cy={5.6} r={4.4} fill={color} />
      <circle cx={10.6} cy={6.6} r={3.6} fill={color} />
      <circle cx={6} cy={4.2} r={1.4} fill={HI} stroke="none" />
    </g>
  );
}

function renderFlower(color: string, dark: string): ReactNode {
  const petals = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    const px = 4 + Math.cos(angle) * 2.3;
    const py = 4 + Math.sin(angle) * 2.3;
    const deg = (angle * 180) / Math.PI;
    return (
      <ellipse
        key={i}
        cx={px}
        cy={py}
        rx={1.7}
        ry={1}
        fill={color}
        stroke={dark}
        strokeWidth={0.22}
        transform={`rotate(${deg} ${px} ${py})`}
      />
    );
  });
  return (
    <>
      <line x1={4} y1={10} x2={4} y2={5} stroke="#3f9b45" strokeWidth={0.7} strokeLinecap="round" />
      <ellipse cx={5} cy={7.4} rx={1.4} ry={0.7} fill="#4eae56" transform="rotate(35 5 7.4)" />
      {petals}
      <circle cx={4} cy={4} r={1.5} fill="#ffcf33" stroke={shade('#ffcf33', 0.8)} strokeWidth={0.22} />
    </>
  );
}

function renderHouse(color: string, dark: string): ReactNode {
  return (
    <>
      <polygon points="0.2,8.2 19.8,8.2 10,0.4" fill="#c65b3f" stroke={shade('#c65b3f', 0.82)} strokeWidth={0.35} strokeLinejoin="round" />
      <rect x={2} y={8} width={16} height={10} rx={0.4} fill={color} stroke={dark} strokeWidth={0.35} />
      <rect x={8.3} y={12.6} width={3.4} height={5.4} rx={0.4} fill="#8a5a2b" stroke={shade('#8a5a2b', 0.8)} strokeWidth={0.25} />
      <circle cx={11} cy={15.3} r={0.35} fill="#ffe066" />
      <rect x={13.2} y={10} width={3.6} height={3.6} rx={0.3} fill="#cdeeff" stroke={dark} strokeWidth={0.28} />
      <line x1={15} y1={10} x2={15} y2={13.6} stroke={dark} strokeWidth={0.22} />
      <line x1={13.2} y1={11.8} x2={16.8} y2={11.8} stroke={dark} strokeWidth={0.22} />
      <rect x={4} y={10} width={3.6} height={3.6} rx={0.3} fill="#cdeeff" stroke={dark} strokeWidth={0.28} />
      <line x1={5.8} y1={10} x2={5.8} y2={13.6} stroke={dark} strokeWidth={0.22} />
      <line x1={4} y1={11.8} x2={7.6} y2={11.8} stroke={dark} strokeWidth={0.22} />
    </>
  );
}

function renderMushroom(color: string, dark: string): ReactNode {
  return (
    <>
      <rect x={2.7} y={4.3} width={2.6} height={4.8} rx={1.1} fill="#f3e6d1" stroke={shade('#f3e6d1', 0.82)} strokeWidth={0.28} />
      <path d="M0.4,4.6 A3.6,3.6 0 0 1 7.6,4.6 Z" fill={color} stroke={dark} strokeWidth={0.3} strokeLinejoin="round" />
      <circle cx={2.4} cy={2.7} r={0.6} fill="#fff" />
      <circle cx={5.4} cy={2.2} r={0.5} fill="#fff" />
      <circle cx={4} cy={3.8} r={0.5} fill="#fff" />
    </>
  );
}

function renderRock(color: string, dark: string): ReactNode {
  return (
    <>
      <polygon
        points="1,7.2 0.6,4.4 2.6,1.5 6,1 10.6,2.6 11.6,5.6 9,7.6 4,7.9"
        fill={color}
        stroke={dark}
        strokeWidth={0.35}
        strokeLinejoin="round"
      />
      <polygon points="2.6,1.5 6,1 5,3 3,3" fill={HI} />
    </>
  );
}

function renderButterfly(color: string, dark: string): ReactNode {
  const wing = shade(color, 0.82);
  return (
    <>
      <ellipse cx={2.5} cy={2.5} rx={2.2} ry={2.5} fill={color} stroke={dark} strokeWidth={0.22} transform="rotate(-20 2.5 2.5)" />
      <ellipse cx={5.5} cy={2.5} rx={2.2} ry={2.5} fill={color} stroke={dark} strokeWidth={0.22} transform="rotate(20 5.5 2.5)" />
      <ellipse cx={2.9} cy={5.4} rx={1.4} ry={1.7} fill={wing} stroke={dark} strokeWidth={0.22} transform="rotate(-15 2.9 5.4)" />
      <ellipse cx={5.1} cy={5.4} rx={1.4} ry={1.7} fill={wing} stroke={dark} strokeWidth={0.22} transform="rotate(15 5.1 5.4)" />
      <circle cx={2.4} cy={2.2} r={0.6} fill={HI} />
      <circle cx={5.6} cy={2.2} r={0.6} fill={HI} />
      <path d="M3.4,1.3 Q3.1,0.5 3.4,0.1" stroke={INK} strokeWidth={0.2} fill="none" />
      <path d="M4.6,1.3 Q4.9,0.5 4.6,0.1" stroke={INK} strokeWidth={0.2} fill="none" />
      <ellipse cx={4} cy={4} rx={0.6} ry={3.2} fill="#3a2f1a" />
    </>
  );
}

function renderSnail(color: string, dark: string): ReactNode {
  const body = shade(color, 1.12);
  return (
    <>
      <path d="M0.5,5.8 Q2.2,7.1 4.2,5.8 Q5.6,5 7,5.4" stroke={body} strokeWidth={1.5} fill="none" strokeLinecap="round" />
      <circle cx={1} cy={4.6} r={1} fill={body} stroke={shade(body, 0.85)} strokeWidth={0.2} />
      <line x1={0.6} y1={3.8} x2={0.2} y2={2.7} stroke={INK} strokeWidth={0.2} strokeLinecap="round" />
      <line x1={1.4} y1={3.8} x2={1.7} y2={2.7} stroke={INK} strokeWidth={0.2} strokeLinecap="round" />
      <circle cx={0.2} cy={2.7} r={0.24} fill={INK} />
      <circle cx={1.7} cy={2.7} r={0.24} fill={INK} />
      <circle cx={7} cy={3.2} r={2.7} fill={color} stroke={dark} strokeWidth={0.32} />
      <path d="M7,3.2 A1.7,1.7 0 1 1 6.9,3.2 M7,3.2 A0.8,0.8 0 1 0 7.1,3.2" fill="none" stroke={dark} strokeWidth={0.28} />
      <circle cx={6.2} cy={2.4} r={0.55} fill={HI} />
    </>
  );
}

function renderArt(kind: SceneItem['kind'], w: number, h: number, color: string, dark: string): ReactNode {
  switch (kind) {
    case 'sun':
      return renderSun(w, h, color, dark);
    case 'cloud':
      return renderCloud(color, dark);
    case 'star':
      return renderStar(color, dark);
    case 'balloon':
      return renderBalloon(color, dark);
    case 'bird':
      return renderBird(color, dark);
    case 'kite':
      return renderKite(color, dark);
    case 'tree':
      return renderTree(w, h, color, dark);
    case 'bush':
      return renderBush(color, dark);
    case 'flower':
      return renderFlower(color, dark);
    case 'house':
      return renderHouse(color, dark);
    case 'mushroom':
      return renderMushroom(color, dark);
    case 'rock':
      return renderRock(color, dark);
    case 'butterfly':
      return renderButterfly(color, dark);
    case 'snail':
      return renderSnail(color, dark);
    default: {
      const exhaustiveCheck: never = kind;
      return exhaustiveCheck;
    }
  }
}

/**
 * Renders one `SceneItem` as a flat, kid-friendly SVG `<g>` in scene space.
 * Colours are semantic per kind (trees green, suns warm, etc.), outlines are a
 * tone-matched darker shade, rounded bodies get a soft highlight, and ground
 * items get a soft contact shadow. Artwork stays inside the item's
 * `ITEM_SPECS[kind].w/h` box so difference hitboxes line up regardless of
 * scale, mirrored in place when `flipped`.
 */
export default function SceneItemView({ item, palette }: SceneItemViewProps) {
  const spec = ITEM_SPECS[item.kind];
  const color = kindColor(item.kind, palette, item.colorIndex);
  const dark = shade(color, 0.72);
  const groundShadow = spec.zone === 'ground';
  return (
    <g transform={`translate(${item.x} ${item.y}) scale(${item.scale})`}>
      {groundShadow && (
        <ellipse
          cx={spec.w / 2}
          cy={spec.h - 0.4}
          rx={spec.w * 0.4}
          ry={Math.max(1, spec.h * 0.06)}
          fill="rgba(44,35,64,0.13)"
        />
      )}
      <g transform={item.flipped ? `translate(${spec.w} 0) scale(-1 1)` : undefined}>
        {renderArt(item.kind, spec.w, spec.h, color, dark)}
      </g>
    </g>
  );
}
