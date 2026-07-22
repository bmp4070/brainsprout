/** An original, hand-drawn (SVG) fjord background used behind a Row Row crossing. */
export interface RowRowScene {
  id: string;
  title: string;
  emoji: string;
  /** Raw 800x450 (16:9) SVG markup, flat colors, simple geometric shapes. */
  svg: string;
}

/** Converts a scene's raw SVG markup into a `data:` URI usable as a CSS background-image. */
export function sceneToDataUri(scene: RowRowScene): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(scene.svg)}`;
}
