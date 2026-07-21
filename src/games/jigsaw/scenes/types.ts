/** An original, hand-drawn (SVG) scene used as jigsaw puzzle artwork. */
export interface JigsawScene {
  id: string;
  title: string;
  emoji: string;
  /** Raw 800x600 (4:3) SVG markup, flat colors, simple geometric shapes. */
  svg: string;
}

/** Converts a scene's raw SVG markup into a `data:` URI usable as a CSS background-image. */
export function sceneToDataUri(scene: JigsawScene): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(scene.svg)}`;
}
