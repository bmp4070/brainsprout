import type { JigsawScene } from './types';

/** Original cheerful outer-space scene: rocket, planets, and stars. */
export const outerSpace: JigsawScene = {
  id: 'outer-space',
  title: 'Outer Space',
  emoji: '🚀',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect x="0" y="0" width="800" height="600" fill="#1b1042" />
  <circle cx="60" cy="60" r="3" fill="#ffffff" />
  <circle cx="140" cy="120" r="2" fill="#ffffff" />
  <circle cx="230" cy="50" r="2.5" fill="#ffffff" />
  <circle cx="320" cy="140" r="2" fill="#ffffff" />
  <circle cx="50" cy="220" r="2.5" fill="#ffffff" />
  <circle cx="700" cy="80" r="3" fill="#ffffff" />
  <circle cx="760" cy="180" r="2" fill="#ffffff" />
  <circle cx="620" cy="40" r="2" fill="#ffffff" />
  <circle cx="500" cy="90" r="2.5" fill="#ffffff" />
  <circle cx="90" cy="380" r="2" fill="#ffffff" />
  <circle cx="180" cy="470" r="2.5" fill="#ffffff" />
  <circle cx="740" cy="420" r="2" fill="#ffffff" />
  <circle cx="670" cy="500" r="2.5" fill="#ffffff" />
  <circle cx="400" cy="30" r="2" fill="#ffffff" />
  <path d="M60,60 l6,0 M63,57 l0,6" stroke="#ffe66d" stroke-width="2" />
  <path d="M700,80 l7,0 M703.5,76.5 l0,7" stroke="#ffe66d" stroke-width="2" />
  <path d="M180,470 l7,0 M183.5,466.5 l0,7" stroke="#ffe66d" stroke-width="2" />
  <circle cx="130" cy="150" r="55" fill="#ff8a3d" />
  <ellipse cx="130" cy="150" rx="90" ry="18" fill="none" stroke="#ffd39a" stroke-width="8" opacity="0.8" />
  <circle cx="120" cy="130" r="10" fill="#e2622a" />
  <circle cx="150" cy="160" r="7" fill="#e2622a" />
  <circle cx="660" cy="470" r="70" fill="#6a89ff" />
  <circle cx="640" cy="450" r="12" fill="#4ecdc4" />
  <circle cx="685" cy="490" r="9" fill="#4ecdc4" />
  <circle cx="670" cy="440" r="6" fill="#d97bff" />
  <circle cx="560" cy="150" r="30" fill="#d97bff" />
  <g transform="translate(400,300) rotate(-25)">
    <rect x="-40" y="-150" width="80" height="180" rx="40" fill="#e8e8f0" />
    <polygon points="-40,-150 0,-230 40,-150" fill="#ff6b6b" />
    <circle cx="0" cy="-110" r="26" fill="#6a89ff" />
    <circle cx="0" cy="-110" r="16" fill="#bfe4ff" />
    <polygon points="-40,10 -80,70 -40,50" fill="#ff6b6b" />
    <polygon points="40,10 80,70 40,50" fill="#ff6b6b" />
    <polygon points="-25,30 0,110 25,30" fill="#ffb84d" />
    <polygon points="-14,30 0,90 14,30" fill="#ffe66d" />
  </g>
  <ellipse cx="400" cy="560" rx="500" ry="60" fill="#120a2e" />
</svg>
`.trim(),
};
