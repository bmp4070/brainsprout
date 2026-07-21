import type { JigsawScene } from './types';

/** Original cheerful cartoon dragon over rolling hills with a little castle. */
export const friendlyDragon: JigsawScene = {
  id: 'friendly-dragon',
  title: 'Friendly Dragon',
  emoji: '🐉',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect x="0" y="0" width="800" height="600" fill="#8ed6ff" />
  <circle cx="670" cy="110" r="55" fill="#fff6b8" />
  <circle cx="120" cy="90" r="34" fill="#ffffff" opacity="0.9" />
  <circle cx="160" cy="100" r="26" fill="#ffffff" opacity="0.9" />
  <circle cx="90" cy="105" r="24" fill="#ffffff" opacity="0.9" />
  <ellipse cx="400" cy="470" rx="500" ry="160" fill="#7bc96f" />
  <ellipse cx="120" cy="500" rx="260" ry="120" fill="#68b95c" />
  <ellipse cx="650" cy="510" rx="280" ry="120" fill="#68b95c" />
  <rect x="560" y="330" width="60" height="90" fill="#c9b28a" />
  <rect x="640" y="300" width="60" height="120" fill="#c9b28a" />
  <rect x="720" y="340" width="50" height="80" fill="#c9b28a" />
  <polygon points="560,330 590,290 620,330" fill="#e2734f" />
  <polygon points="640,300 670,255 700,300" fill="#e2734f" />
  <polygon points="720,340 745,305 770,340" fill="#e2734f" />
  <rect x="666" y="230" width="8" height="30" fill="#7a5c3a" />
  <polygon points="674,232 700,242 674,252" fill="#ff8a3d" />
  <ellipse cx="380" cy="430" rx="150" ry="90" fill="#7bd67e" />
  <circle cx="290" cy="360" r="70" fill="#7bd67e" />
  <polygon points="250,300 265,340 285,315" fill="#5fbf63" />
  <polygon points="300,290 310,335 330,315" fill="#5fbf63" />
  <circle cx="265" cy="345" r="9" fill="#2c2340" />
  <circle cx="315" cy="345" r="9" fill="#2c2340" />
  <path d="M270,375 Q290,395 320,375" stroke="#2c2340" stroke-width="5" fill="none" stroke-linecap="round" />
  <circle cx="240" cy="365" r="14" fill="#ffb6c1" opacity="0.8" />
  <circle cx="345" cy="365" r="14" fill="#ffb6c1" opacity="0.8" />
  <path d="M330,340 Q400,300 420,360 Q400,340 350,360 Z" fill="#5fbf63" />
  <path d="M480,430 Q560,410 540,470 Q500,450 470,460 Z" fill="#5fbf63" />
  <path d="M460,440 Q500,520 440,540 Q460,490 440,460 Z" fill="#7bd67e" />
  <polygon points="430,540 445,565 460,540" fill="#5fbf63" />
  <polygon points="150,560 800,560 800,600 150,600" fill="#68b95c" />
  <circle cx="100" cy="540" r="16" fill="#ffe66d" />
  <circle cx="700" cy="560" r="14" fill="#ffb84d" />
</svg>
`.trim(),
};
