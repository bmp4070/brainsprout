import type { JigsawScene } from './types';

/** Original cheerful under-the-sea scene: fish, an octopus, and coral. */
export const underTheSea: JigsawScene = {
  id: 'under-the-sea',
  title: 'Under the Sea',
  emoji: '🐠',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect x="0" y="0" width="800" height="600" fill="#4fc3d9" />
  <rect x="0" y="380" width="800" height="220" fill="#2fa9c2" />
  <circle cx="120" cy="90" r="14" fill="#ffffff" opacity="0.6" />
  <circle cx="150" cy="70" r="9" fill="#ffffff" opacity="0.6" />
  <circle cx="640" cy="60" r="12" fill="#ffffff" opacity="0.6" />
  <circle cx="80" cy="250" r="7" fill="#ffffff" opacity="0.5" />
  <circle cx="720" cy="220" r="8" fill="#ffffff" opacity="0.5" />
  <circle cx="500" cy="120" r="6" fill="#ffffff" opacity="0.5" />
  <g>
    <path d="M600,420 Q500,470 600,540 Q640,500 640,480 Q640,460 600,420" fill="#5fbf63" />
    <path d="M660,430 Q580,460 660,530 Q690,490 690,470 Q690,450 660,430" fill="#7bd67e" />
    <path d="M700,420 Q650,450 700,510 Q725,480 725,460 Q725,440 700,420" fill="#5fbf63" />
    <circle cx="200" cy="440" r="30" fill="#ff8a3d" />
    <circle cx="240" cy="470" r="22" fill="#ffb84d" />
    <circle cx="150" cy="480" r="18" fill="#ffe66d" />
  </g>
  <g transform="translate(220,220)">
    <ellipse cx="0" cy="0" rx="70" ry="46" fill="#ff8a3d" />
    <polygon points="-70,0 -120,-30 -120,30" fill="#f26a1b" />
    <circle cx="30" cy="-10" r="10" fill="#ffffff" />
    <circle cx="33" cy="-10" r="5" fill="#2c2340" />
    <path d="M-10,30 Q0,45 10,30" stroke="#f26a1b" stroke-width="4" fill="none" stroke-linecap="round" />
    <ellipse cx="0" cy="-40" rx="30" ry="12" fill="#ffb84d" />
  </g>
  <g transform="translate(560,260) scale(-1,1)">
    <ellipse cx="0" cy="0" rx="45" ry="30" fill="#d97bff" />
    <polygon points="-45,0 -80,-18 -80,18" fill="#b158d6" />
    <circle cx="20" cy="-6" r="6" fill="#ffffff" />
    <circle cx="22" cy="-6" r="3" fill="#2c2340" />
  </g>
  <g transform="translate(400,480)">
    <circle cx="0" cy="0" r="65" fill="#6a89ff" />
    <circle cx="-22" cy="-15" r="9" fill="#ffffff" />
    <circle cx="-19" cy="-15" r="4.5" fill="#2c2340" />
    <circle cx="22" cy="-15" r="9" fill="#ffffff" />
    <circle cx="25" cy="-15" r="4.5" fill="#2c2340" />
    <path d="M-20,20 Q0,35 20,20" stroke="#2c2340" stroke-width="5" fill="none" stroke-linecap="round" />
    <path d="M-40,40 Q-70,90 -30,120 Q-40,90 -20,70" stroke="#6a89ff" stroke-width="16" fill="none" stroke-linecap="round" />
    <path d="M0,55 Q0,110 -10,140" stroke="#6a89ff" stroke-width="16" fill="none" stroke-linecap="round" />
    <path d="M40,40 Q70,90 30,120 Q40,90 20,70" stroke="#6a89ff" stroke-width="16" fill="none" stroke-linecap="round" />
    <path d="M55,10 Q100,30 90,70" stroke="#6a89ff" stroke-width="16" fill="none" stroke-linecap="round" />
  </g>
</svg>
`.trim(),
};
