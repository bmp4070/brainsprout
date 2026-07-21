import type { JigsawScene } from './types';

/** Original cheerful jungle scene: a toucan, a monkey, and big leaves. */
export const jungle: JigsawScene = {
  id: 'jungle',
  title: 'Jungle',
  emoji: '🌴',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect x="0" y="0" width="800" height="600" fill="#bff0a8" />
  <circle cx="680" cy="90" r="50" fill="#ffe66d" />
  <ellipse cx="400" cy="520" rx="500" ry="130" fill="#5fbf63" />
  <path d="M0,300 Q120,220 260,300 Q140,300 0,360 Z" fill="#3f9b45" />
  <path d="M800,260 Q660,190 540,270 Q660,270 800,330 Z" fill="#3f9b45" />
  <path d="M0,440 Q100,380 220,440 Q110,440 0,500 Z" fill="#2f8a37" />
  <path d="M800,420 Q690,360 580,420 Q690,420 800,480 Z" fill="#2f8a37" />
  <rect x="120" y="330" width="18" height="180" fill="#8a5a2b" />
  <path d="M129,330 Q60,280 40,320 Q90,320 129,350" fill="#5fbf63" />
  <path d="M129,330 Q200,280 220,320 Q170,320 129,350" fill="#5fbf63" />
  <path d="M129,300 Q129,240 90,220 Q120,270 129,300" fill="#3f9b45" />
  <path d="M129,300 Q129,240 168,220 Q138,270 129,300" fill="#3f9b45" />
  <path d="M300,260 Q210,120 260,90 Q290,190 320,260 Z" stroke="#2f8a37" stroke-width="2" fill="#5fbf63" />
  <path d="M340,270 Q400,110 450,120 Q400,200 380,270 Z" stroke="#2f8a37" stroke-width="2" fill="#7bd67e" />
  <g transform="translate(230,220)">
    <ellipse cx="0" cy="10" rx="34" ry="40" fill="#2c2340" />
    <circle cx="0" cy="-40" r="30" fill="#2c2340" />
    <circle cx="12" cy="-46" r="7" fill="#ffffff" />
    <circle cx="15" cy="-46" r="3.5" fill="#000000" />
    <path d="M25,-40 Q90,-46 110,-30 Q90,-18 25,-24 Z" fill="#ff8a3d" />
    <path d="M25,-24 Q80,-20 110,-30" stroke="#e2622a" stroke-width="3" fill="none" />
    <ellipse cx="-20" cy="10" rx="10" ry="24" fill="#4ecdc4" />
    <ellipse cx="20" cy="10" rx="10" ry="24" fill="#4ecdc4" />
  </g>
  <g transform="translate(560,380)">
    <circle cx="0" cy="0" r="46" fill="#b98354" />
    <circle cx="-46" cy="-6" r="16" fill="#b98354" />
    <circle cx="46" cy="-6" r="16" fill="#b98354" />
    <circle cx="-46" cy="-6" r="9" fill="#e9c9a6" />
    <circle cx="46" cy="-6" r="9" fill="#e9c9a6" />
    <ellipse cx="0" cy="8" rx="24" ry="20" fill="#e9c9a6" />
    <circle cx="-12" cy="-4" r="5" fill="#2c2340" />
    <circle cx="12" cy="-4" r="5" fill="#2c2340" />
    <path d="M-10,18 Q0,26 10,18" stroke="#2c2340" stroke-width="3" fill="none" stroke-linecap="round" />
    <ellipse cx="0" cy="70" rx="30" ry="40" fill="#b98354" />
    <path d="M-30,60 Q-70,90 -55,140" stroke="#b98354" stroke-width="12" fill="none" stroke-linecap="round" />
    <path d="M30,60 Q70,90 55,140" stroke="#b98354" stroke-width="12" fill="none" stroke-linecap="round" />
  </g>
  <path d="M420,420 Q500,470 460,540" stroke="#ffe66d" stroke-width="10" fill="none" stroke-linecap="round" opacity="0.7" />
</svg>
`.trim(),
};
