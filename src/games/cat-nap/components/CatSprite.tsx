/**
 * A small original SVG "napping cat" face, one of six hand-tuned variants
 * (0-5) so every colored puzzle region gets its own recognizable cat. Each
 * variant pairs a fur tone with a pattern/accessory so kids can tell them
 * apart at a glance, and the fur/outline colors are chosen to stay visible
 * against that region's own --word-color-N background.
 */
export interface CatSpriteProps {
  /** Region index; wraps to 0-5 so any region id is safe to pass in. */
  variant: number;
  /** CSS size (width & height) for the rendered SVG. Defaults to '100%'. */
  size?: number | string;
  className?: string;
}

const OUTLINE = '#2c2340';
const VARIANT_COUNT = 6;

interface VariantStyle {
  fur: string;
  stripe?: string;
}

const VARIANT_STYLES: VariantStyle[] = [
  { fur: '#e8630f', stripe: '#b84a06' }, // 0: orange tabby
  { fur: '#8f97a6' }, // 1: gray cat, white muzzle patch
  { fur: '#e8c27a', stripe: '#8a5a2b' }, // 2: golden/cream, brown ear tip
  { fur: '#ffffff' }, // 3: white cat, teal collar + bell
  { fur: '#5b6b8c' }, // 4: blue-gray, white chest bib
  { fur: '#ffffff' }, // 5: calico, orange + dark patches
];

function EarShapes({ fill }: { fill: string }) {
  return (
    <>
      <polygon points="8,15 13,3 19,16" fill={fill} stroke={OUTLINE} strokeWidth={1.5} strokeLinejoin="round" />
      <polygon points="21,16 27,3 32,15" fill={fill} stroke={OUTLINE} strokeWidth={1.5} strokeLinejoin="round" />
    </>
  );
}

function SleepyFace() {
  return (
    <>
      {/* Closed, sleepy eyes as gentle curved lines. */}
      <path d="M12,22 q3,3 6,0" fill="none" stroke={OUTLINE} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M22,22 q3,3 6,0" fill="none" stroke={OUTLINE} strokeWidth={1.5} strokeLinecap="round" />
      {/* Tiny nose. */}
      <polygon points="18.5,27 21.5,27 20,29" fill="#d9748c" stroke={OUTLINE} strokeWidth={1} strokeLinejoin="round" />
      {/* Whiskers. */}
      <path d="M12,28 h-6 M12,30.5 h-5.5" stroke={OUTLINE} strokeWidth={1} strokeLinecap="round" />
      <path d="M28,28 h6 M28,30.5 h5.5" stroke={OUTLINE} strokeWidth={1} strokeLinecap="round" />
    </>
  );
}

function VariantExtras({ variant }: { variant: number }) {
  switch (variant) {
    case 0: {
      // Orange tabby: darker forehead stripes.
      const stripe = VARIANT_STYLES[0].stripe;
      return (
        <path
          d="M15,10 l2,4 M20,8.5 v4.5 M25,10 l-2,4"
          stroke={stripe}
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
        />
      );
    }
    case 1:
      // Gray cat: white muzzle patch.
      return <ellipse cx={20} cy={28.5} rx={7} ry={5} fill="#ffffff" stroke={OUTLINE} strokeWidth={1} />;
    case 2:
      // Golden/cream cat: one folded, darker ear tip.
      return (
        <polygon
          points="21,16 27,3 32,15"
          fill={VARIANT_STYLES[2].stripe}
          stroke={OUTLINE}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      );
    case 3:
      // White cat: teal collar with a small bell.
      return (
        <>
          <path d="M9,32 Q20,38 31,32" fill="none" stroke="#1f8a82" strokeWidth={3.5} strokeLinecap="round" />
          <circle cx={20} cy={36.5} r={2.4} fill="#ffe66d" stroke={OUTLINE} strokeWidth={1} />
        </>
      );
    case 4:
      // Blue-gray cat: white chest bib.
      return (
        <path
          d="M14,31 Q20,40 26,31 Q20,36 14,31 Z"
          fill="#ffffff"
          stroke={OUTLINE}
          strokeWidth={1.2}
          strokeLinejoin="round"
        />
      );
    case 5:
      // Calico: irregular orange + dark patches over the white base.
      return (
        <>
          <path
            d="M8,17 Q6,10 13,8 Q18,10 15,18 Q11,22 8,17 Z"
            fill="#f2924b"
            stroke={OUTLINE}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <path
            d="M27,22 Q33,20 33,27 Q30,33 24,30 Q23,25 27,22 Z"
            fill="#4a3b2c"
            stroke={OUTLINE}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
        </>
      );
    default:
      return null;
  }
}

export default function CatSprite({ variant, size = '100%', className }: CatSpriteProps) {
  const v = ((variant % VARIANT_COUNT) + VARIANT_COUNT) % VARIANT_COUNT;
  const { fur } = VARIANT_STYLES[v];

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <EarShapes fill={fur} />
      <circle cx={20} cy={23} r={13} fill={fur} stroke={OUTLINE} strokeWidth={1.5} />
      <VariantExtras variant={v} />
      <SleepyFace />
    </svg>
  );
}
