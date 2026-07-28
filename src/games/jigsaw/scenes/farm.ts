import type { JigsawScene } from './types';

/** Original cheerful barnyard scene: a red barn, a cow, and a chicken. */
export const farm: JigsawScene = {
  id: 'farm',
  title: 'Farm',
  emoji: '🐮',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect x="0" y="0" width="800" height="600" fill="#9fdcff" />
  <circle cx="670" cy="90" r="55" fill="#ffe66d" />
  <circle cx="130" cy="90" r="30" fill="#ffffff" opacity="0.9" />
  <circle cx="165" cy="100" r="22" fill="#ffffff" opacity="0.9" />
  <circle cx="100" cy="102" r="18" fill="#ffffff" opacity="0.9" />
  <ellipse cx="400" cy="560" rx="500" ry="140" fill="#8fd15c" />
  <path d="M0,480 Q200,430 400,470 Q600,510 800,450 L800,600 L0,600 Z" fill="#6fc24a" />
  <rect x="480" y="330" width="220" height="170" fill="#c0392b" />
  <polygon points="465,330 590,235 715,330" fill="#8a2f22" />
  <rect x="465" y="325" width="250" height="16" fill="#7a2818" />
  <rect x="560" y="420" width="60" height="80" fill="#5a3a22" />
  <path d="M590,420 L590,500" stroke="#3f2814" stroke-width="4" />
  <circle cx="600" cy="460" r="4" fill="#e8d9c0" />
  <circle cx="590" cy="285" r="20" fill="#f5deb3" />
  <path d="M590,265 L590,305 M570,285 L610,285" stroke="#7a2818" stroke-width="4" />
  <rect x="500" y="360" width="40" height="40" fill="#7a2818" />
  <path d="M500,380 L540,380 M520,360 L520,400" stroke="#c0392b" stroke-width="3" />
  <rect x="640" y="360" width="40" height="40" fill="#7a2818" />
  <path d="M640,380 L680,380 M660,360 L660,400" stroke="#c0392b" stroke-width="3" />
  <path d="M40,540 L780,540" stroke="#c9a06a" stroke-width="8" fill="none" />
  <path d="M40,565 L780,565" stroke="#c9a06a" stroke-width="8" fill="none" />
  <rect x="40" y="510" width="12" height="80" fill="#a9824f" />
  <rect x="160" y="510" width="12" height="80" fill="#a9824f" />
  <rect x="330" y="510" width="12" height="80" fill="#a9824f" />
  <rect x="720" y="510" width="12" height="80" fill="#a9824f" />
  <g transform="translate(230,470)">
    <ellipse cx="0" cy="0" rx="70" ry="45" fill="#ffffff" />
    <ellipse cx="-30" cy="-10" rx="18" ry="14" fill="#2c2340" />
    <ellipse cx="24" cy="12" rx="24" ry="17" fill="#2c2340" />
    <rect x="-60" y="30" width="14" height="40" fill="#ffffff" />
    <rect x="-20" y="30" width="14" height="40" fill="#ffffff" />
    <rect x="20" y="30" width="14" height="40" fill="#ffffff" />
    <rect x="55" y="30" width="14" height="40" fill="#ffffff" />
    <circle cx="70" cy="-30" r="30" fill="#ffffff" />
    <ellipse cx="92" cy="-18" rx="14" ry="10" fill="#ffe0d0" />
    <circle cx="82" cy="-40" r="4" fill="#2c2340" />
    <circle cx="96" cy="-34" r="4" fill="#2c2340" />
    <path d="M60,-55 Q54,-72 65,-74" stroke="#e8d9c0" stroke-width="5" fill="none" stroke-linecap="round" />
    <path d="M80,-58 Q88,-74 98,-70" stroke="#e8d9c0" stroke-width="5" fill="none" stroke-linecap="round" />
    <ellipse cx="55" cy="-6" rx="10" ry="8" fill="#2c2340" />
  </g>
  <g transform="translate(420,520)">
    <ellipse cx="0" cy="0" rx="34" ry="30" fill="#ffffff" />
    <circle cx="26" cy="-18" r="16" fill="#ffffff" />
    <path d="M20,-32 Q26,-42 32,-32 Q26,-34 20,-32 Z" fill="#e8443c" />
    <path d="M40,-18 L54,-14 L40,-10 Z" fill="#ff8a3d" />
    <circle cx="30" cy="-20" r="3" fill="#2c2340" />
    <path d="M-10,26 L-16,36 M2,26 L2,38 M14,26 L20,36" stroke="#ff8a3d" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M-30,0 Q-45,-6 -40,10 Q-30,10 -25,4 Z" fill="#f2f2f2" />
  </g>
</svg>
`.trim(),
};
