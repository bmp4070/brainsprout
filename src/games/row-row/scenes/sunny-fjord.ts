import type { RowRowScene } from './types';

/** Original bright daytime fjord: blue sky, sun, green mountains, blue water. */
export const sunnyFjord: RowRowScene = {
  id: 'sunny-fjord',
  title: 'Sunny Fjord',
  emoji: '☀️',
  svg: `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
  <rect x="0" y="0" width="800" height="450" fill="#8ed6ff" />
  <circle cx="680" cy="80" r="46" fill="#ffe36b" />
  <circle cx="150" cy="70" r="26" fill="#ffffff" opacity="0.9" />
  <circle cx="190" cy="80" r="20" fill="#ffffff" opacity="0.9" />
  <circle cx="115" cy="82" r="18" fill="#ffffff" opacity="0.9" />
  <polygon points="0,230 160,90 320,230" fill="#7a8b99" />
  <polygon points="60,230 160,130 260,230" fill="#c9d6dc" />
  <polygon points="220,230 420,110 620,230" fill="#8fa2ac" />
  <polygon points="320,230 420,150 520,230" fill="#dbe6ea" />
  <polygon points="500,230 660,120 800,230" fill="#7a8b99" />
  <polygon points="560,230 660,150 740,230" fill="#c9d6dc" />
  <rect x="0" y="220" width="800" height="230" fill="#2f7fb8" />
  <ellipse cx="150" cy="270" rx="90" ry="8" fill="#4a97cf" opacity="0.6" />
  <ellipse cx="420" cy="310" rx="120" ry="9" fill="#4a97cf" opacity="0.6" />
  <ellipse cx="650" cy="260" rx="100" ry="8" fill="#4a97cf" opacity="0.6" />
  <ellipse cx="260" cy="360" rx="140" ry="10" fill="#4a97cf" opacity="0.5" />
  <ellipse cx="580" cy="400" rx="160" ry="10" fill="#4a97cf" opacity="0.5" />
</svg>
`.trim(),
};
