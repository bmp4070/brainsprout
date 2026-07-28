import type { JigsawScene } from './types';

/** Original cheerful arctic scene: waddling penguins beside a snowy igloo. */
export const penguins: JigsawScene = {
  id: 'penguins',
  title: 'Penguins',
  emoji: '🐧',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect x="0" y="0" width="800" height="600" fill="#cfeffc" />
  <path d="M0,80 Q200,40 400,90 Q600,140 800,70 L800,160 Q600,220 400,170 Q200,120 0,170 Z" fill="#b8f2e6" opacity="0.55" />
  <path d="M0,140 Q200,100 400,150 Q600,200 800,130 L800,190 Q600,250 400,200 Q200,150 0,200 Z" fill="#d9b8f2" opacity="0.4" />
  <circle cx="120" cy="90" r="45" fill="#fff6d8" opacity="0.9" />
  <ellipse cx="150" cy="430" rx="220" ry="90" fill="#eaf6fb" />
  <ellipse cx="650" cy="440" rx="260" ry="100" fill="#eaf6fb" />
  <rect x="0" y="460" width="800" height="20" fill="#eef7fb" />
  <rect x="0" y="480" width="800" height="120" fill="#ffffff" />
  <path d="M0,470 Q60,455 130,470 Q80,478 0,485 Z" fill="#e4f2f9" />
  <path d="M800,480 Q720,462 640,480 Q710,490 800,498 Z" fill="#e4f2f9" />
  <g transform="translate(560,440)">
    <path d="M-110,70 A110,110 0 0 1 110,70 Z" fill="#eef8fd" />
    <path d="M-110,70 L110,70 L110,88 L-110,88 Z" fill="#dceef7" />
    <path d="M-34,70 Q-34,14 0,14 Q34,14 34,70 Z" fill="#bcdcec" />
    <path d="M-34,70 L-34,88 L34,88 L34,70 Z" fill="#9fc4d6" />
    <path d="M-70,66 Q-70,30 -35,15" stroke="#cfe6f2" stroke-width="4" fill="none" />
    <path d="M-35,66 Q-35,20 0,16" stroke="#cfe6f2" stroke-width="4" fill="none" />
    <path d="M0,66 Q0,20 35,16" stroke="#cfe6f2" stroke-width="4" fill="none" />
    <path d="M35,66 Q35,30 70,15" stroke="#cfe6f2" stroke-width="4" fill="none" />
  </g>
  <path d="M700,150 L700,170 M690,160 L710,160" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
  <path d="M240,120 L240,138 M231,129 L249,129" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
  <path d="M340,220 L340,236 M332,228 L348,228" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
  <path d="M60,230 L60,246 M52,238 L68,238" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
  <path d="M470,90 L470,106 M462,98 L478,98" stroke="#ffffff" stroke-width="3" stroke-linecap="round" />
  <g transform="translate(210,520)">
    <ellipse cx="0" cy="0" rx="45" ry="60" fill="#2c2340" />
    <ellipse cx="0" cy="10" rx="26" ry="42" fill="#ffffff" />
    <ellipse cx="-40" cy="0" rx="14" ry="34" fill="#2c2340" />
    <ellipse cx="40" cy="0" rx="14" ry="34" fill="#2c2340" />
    <circle cx="0" cy="-58" r="26" fill="#2c2340" />
    <circle cx="-9" cy="-62" r="5" fill="#ffffff" />
    <circle cx="-7" cy="-62" r="2.5" fill="#2c2340" />
    <circle cx="9" cy="-62" r="5" fill="#ffffff" />
    <circle cx="11" cy="-62" r="2.5" fill="#2c2340" />
    <path d="M-6,-52 L6,-52 L0,-42 Z" fill="#ff8a3d" />
    <path d="M-30,58 L-40,68 L-20,68 Z" fill="#ff8a3d" />
    <path d="M30,58 L40,68 L20,68 Z" fill="#ff8a3d" />
  </g>
  <g transform="translate(330,545) scale(0.8,0.8)">
    <ellipse cx="0" cy="0" rx="45" ry="60" fill="#2c2340" />
    <ellipse cx="0" cy="10" rx="26" ry="42" fill="#ffffff" />
    <ellipse cx="-40" cy="0" rx="14" ry="34" fill="#2c2340" />
    <ellipse cx="40" cy="0" rx="14" ry="34" fill="#2c2340" />
    <circle cx="0" cy="-58" r="26" fill="#2c2340" />
    <circle cx="-9" cy="-62" r="5" fill="#ffffff" />
    <circle cx="-7" cy="-62" r="2.5" fill="#2c2340" />
    <circle cx="9" cy="-62" r="5" fill="#ffffff" />
    <circle cx="11" cy="-62" r="2.5" fill="#2c2340" />
    <path d="M-6,-52 L6,-52 L0,-42 Z" fill="#ff8a3d" />
    <path d="M-30,58 L-40,68 L-20,68 Z" fill="#ff8a3d" />
    <path d="M30,58 L40,68 L20,68 Z" fill="#ff8a3d" />
  </g>
  <g transform="translate(140,565) scale(0.65,0.65)">
    <ellipse cx="0" cy="0" rx="45" ry="60" fill="#2c2340" />
    <ellipse cx="0" cy="10" rx="26" ry="42" fill="#ffffff" />
    <ellipse cx="-40" cy="0" rx="14" ry="34" fill="#2c2340" />
    <ellipse cx="40" cy="0" rx="14" ry="34" fill="#2c2340" />
    <circle cx="0" cy="-58" r="26" fill="#2c2340" />
    <circle cx="-9" cy="-62" r="5" fill="#ffffff" />
    <circle cx="-7" cy="-62" r="2.5" fill="#2c2340" />
    <circle cx="9" cy="-62" r="5" fill="#ffffff" />
    <circle cx="11" cy="-62" r="2.5" fill="#2c2340" />
    <path d="M-6,-52 L6,-52 L0,-42 Z" fill="#ff8a3d" />
    <path d="M-30,58 L-40,68 L-20,68 Z" fill="#ff8a3d" />
    <path d="M30,58 L40,68 L20,68 Z" fill="#ff8a3d" />
  </g>
</svg>
`.trim(),
};
