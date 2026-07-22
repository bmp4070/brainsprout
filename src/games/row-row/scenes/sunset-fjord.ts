import type { RowRowScene } from './types';

/** Original dusk fjord: orange/pink sky, low sun, purple mountains, dark water. */
export const sunsetFjord: RowRowScene = {
  id: 'sunset-fjord',
  title: 'Sunset Fjord',
  emoji: '🌇',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <rect x="0" y="0" width="800" height="450" fill="#ff9d6c" />
  <rect x="0" y="0" width="800" height="230" fill="#ffb48a" opacity="0.5" />
  <circle cx="400" cy="180" r="60" fill="#ffd36b" />
  <polygon points="0,240 180,100 360,240" fill="#5c4373" />
  <polygon points="70,240 180,140 290,240" fill="#7a5a96" />
  <polygon points="280,240 440,120 600,240" fill="#4b3760" />
  <polygon points="360,240 440,160 520,240" fill="#6c4f89" />
  <polygon points="520,240 680,110 800,240" fill="#5c4373" />
  <polygon points="590,240 680,150 760,240" fill="#7a5a96" />
  <rect x="0" y="230" width="800" height="220" fill="#33305f" />
  <ellipse cx="400" cy="250" rx="70" ry="26" fill="#ffb37a" opacity="0.55" />
  <ellipse cx="160" cy="300" rx="90" ry="8" fill="#4a4680" opacity="0.6" />
  <ellipse cx="430" cy="340" rx="120" ry="9" fill="#4a4680" opacity="0.6" />
  <ellipse cx="660" cy="290" rx="100" ry="8" fill="#4a4680" opacity="0.6" />
  <ellipse cx="270" cy="390" rx="140" ry="10" fill="#4a4680" opacity="0.5" />
</svg>
`.trim(),
};
