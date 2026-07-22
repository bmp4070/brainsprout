import type { RowRowScene } from './types';

/** Original night fjord: dark sky, aurora ribbons, stars, snowy mountains. */
export const northernLightsFjord: RowRowScene = {
  id: 'northern-lights-fjord',
  title: 'Northern Lights Fjord',
  emoji: '🌌',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <rect x="0" y="0" width="800" height="450" fill="#0e1a3a" />
  <circle cx="120" cy="70" r="2.5" fill="#ffffff" />
  <circle cx="220" cy="50" r="2" fill="#ffffff" />
  <circle cx="340" cy="90" r="2.5" fill="#ffffff" />
  <circle cx="480" cy="45" r="2" fill="#ffffff" />
  <circle cx="600" cy="75" r="2.5" fill="#ffffff" />
  <circle cx="700" cy="55" r="2" fill="#ffffff" />
  <circle cx="60" cy="120" r="2" fill="#ffffff" />
  <circle cx="760" cy="130" r="2.5" fill="#ffffff" />
  <path d="M40,90 Q220,20 400,110 Q560,180 760,80" stroke="#5cffa0" stroke-width="26" fill="none" opacity="0.35" />
  <path d="M60,140 Q260,60 440,150 Q600,220 780,120" stroke="#7bd9ff" stroke-width="20" fill="none" opacity="0.3" />
  <path d="M20,180 Q220,120 420,190 Q600,250 780,170" stroke="#c88bff" stroke-width="18" fill="none" opacity="0.25" />
  <polygon points="0,260 160,130 320,260" fill="#3a4260" />
  <polygon points="60,260 160,170 260,260" fill="#e8edf5" />
  <polygon points="220,260 420,150 620,260" fill="#2c3350" />
  <polygon points="320,260 420,190 520,260" fill="#e8edf5" />
  <polygon points="500,260 660,160 800,260" fill="#3a4260" />
  <polygon points="560,260 660,190 740,260" fill="#e8edf5" />
  <rect x="0" y="250" width="800" height="200" fill="#0a1230" />
  <ellipse cx="180" cy="300" rx="90" ry="7" fill="#28305a" opacity="0.7" />
  <ellipse cx="440" cy="340" rx="120" ry="8" fill="#28305a" opacity="0.7" />
  <ellipse cx="660" cy="290" rx="100" ry="7" fill="#28305a" opacity="0.7" />
  <ellipse cx="300" cy="390" rx="140" ry="9" fill="#28305a" opacity="0.6" />
</svg>
`.trim(),
};
