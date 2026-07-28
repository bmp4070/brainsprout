import type { JigsawScene } from './types';

/** Original cheerful scene: flamingos wading in a tropical lagoon. */
export const flamingos: JigsawScene = {
  id: 'flamingos',
  title: 'Flamingos',
  emoji: '🦩',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect x="0" y="0" width="800" height="600" fill="#bdeeff" />
  <circle cx="680" cy="85" r="55" fill="#ffe66d" />
  <rect x="0" y="370" width="800" height="230" fill="#5fd6e6" />
  <rect x="0" y="470" width="800" height="130" fill="#39bcd6" />
  <path d="M40,370 Q60,180 90,120 Q100,180 80,260 Q95,220 100,180 Q108,260 90,370 Z" fill="#3f9b45" />
  <path d="M60,370 Q30,300 -10,290 Q20,330 40,370 Z" fill="#2f8a37" />
  <path d="M60,370 Q95,300 140,300 Q110,335 80,370 Z" fill="#2f8a37" />
  <rect x="82" y="330" width="14" height="60" fill="#8a5a2b" />
  <path d="M760,380 Q770,240 790,190 Q796,240 782,300 Q792,270 796,240 Q800,300 786,380 Z" fill="#2f8a37" />
  <rect x="778" y="350" width="12" height="40" fill="#8a5a2b" />
  <ellipse cx="180" cy="470" rx="55" ry="16" fill="#4fae54" />
  <ellipse cx="260" cy="500" rx="40" ry="12" fill="#5fbf63" />
  <ellipse cx="600" cy="480" rx="60" ry="17" fill="#4fae54" />
  <ellipse cx="520" cy="510" rx="35" ry="10" fill="#5fbf63" />
  <circle cx="185" cy="468" r="7" fill="#ff8fb1" />
  <path d="M120,420 Q124,380 118,360 M140,420 Q144,385 138,362 M660,430 Q666,390 658,368" stroke="#3f9b45" stroke-width="4" fill="none" stroke-linecap="round" />
  <g transform="translate(260,430)">
    <path d="M-10,45 L-15,140 M10,45 L15,140" stroke="#e8895f" stroke-width="6" fill="none" stroke-linecap="round" />
    <path d="M-15,140 L-28,150 M-15,140 L-2,148 M15,140 L2,148 M15,140 L28,150" stroke="#e8895f" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M-30,10 Q-60,-10 -45,-35" stroke="#f76ca1" stroke-width="14" fill="none" stroke-linecap="round" />
    <ellipse cx="0" cy="0" rx="42" ry="50" fill="#ff8fb1" />
    <ellipse cx="10" cy="6" rx="28" ry="34" fill="#f76ca1" />
    <path d="M-15,-45 Q-55,-95 -30,-140 Q-5,-130 5,-125" stroke="#ff8fb1" stroke-width="16" fill="none" stroke-linecap="round" />
    <circle cx="-25" cy="-138" r="17" fill="#ff8fb1" />
    <circle cx="-33" cy="-142" r="4" fill="#2c2340" />
    <path d="M-40,-134 Q-72,-128 -78,-118 Q-58,-112 -38,-122 Z" fill="#2c2340" />
    <path d="M-40,-134 Q-60,-130 -64,-122 Q-52,-118 -38,-124 Z" fill="#ffb84d" />
  </g>
  <g transform="translate(400,460) scale(0.85,0.85)">
    <path d="M-10,45 L-15,140 M10,45 L15,140" stroke="#e8895f" stroke-width="6" fill="none" stroke-linecap="round" />
    <path d="M-15,140 L-28,150 M-15,140 L-2,148 M15,140 L2,148 M15,140 L28,150" stroke="#e8895f" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M28,10 Q58,-8 46,-32" stroke="#f76ca1" stroke-width="13" fill="none" stroke-linecap="round" />
    <ellipse cx="0" cy="0" rx="40" ry="48" fill="#ffa0c0" />
    <ellipse cx="-9" cy="6" rx="26" ry="32" fill="#f76ca1" />
    <path d="M15,-43 Q55,-90 32,-135 Q8,-125 -2,-120" stroke="#ffa0c0" stroke-width="15" fill="none" stroke-linecap="round" />
    <circle cx="26" cy="-133" r="16" fill="#ffa0c0" />
    <circle cx="34" cy="-137" r="4" fill="#2c2340" />
    <path d="M40,-129 Q72,-122 78,-112 Q58,-107 38,-116 Z" fill="#2c2340" />
    <path d="M40,-129 Q60,-125 64,-118 Q52,-113 38,-119 Z" fill="#ffb84d" />
  </g>
  <g transform="translate(550,440) scale(1.1,1.1)">
    <path d="M-10,45 L-15,140 M10,45 L15,140" stroke="#e8895f" stroke-width="6" fill="none" stroke-linecap="round" />
    <path d="M-15,140 L-28,150 M-15,140 L-2,148 M15,140 L2,148 M15,140 L28,150" stroke="#e8895f" stroke-width="4" fill="none" stroke-linecap="round" />
    <path d="M-30,10 Q-60,-10 -45,-35" stroke="#f76ca1" stroke-width="14" fill="none" stroke-linecap="round" />
    <ellipse cx="0" cy="0" rx="42" ry="50" fill="#ff8fb1" />
    <ellipse cx="10" cy="6" rx="28" ry="34" fill="#f76ca1" />
    <path d="M-15,-45 Q-55,-95 -30,-140 Q-5,-130 5,-125" stroke="#ff8fb1" stroke-width="16" fill="none" stroke-linecap="round" />
    <circle cx="-25" cy="-138" r="17" fill="#ff8fb1" />
    <circle cx="-33" cy="-142" r="4" fill="#2c2340" />
    <path d="M-40,-134 Q-72,-128 -78,-118 Q-58,-112 -38,-122 Z" fill="#2c2340" />
    <path d="M-40,-134 Q-60,-130 -64,-122 Q-52,-118 -38,-124 Z" fill="#ffb84d" />
  </g>
</svg>
`.trim(),
};
