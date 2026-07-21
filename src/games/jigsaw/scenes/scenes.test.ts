import { describe, expect, it } from 'vitest';
import { scenes, sceneToDataUri } from './index';

describe('jigsaw scenes', () => {
  it('has exactly 4 scenes', () => {
    expect(scenes).toHaveLength(4);
  });

  it('has unique ids', () => {
    const ids = scenes.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every scene has a title and emoji', () => {
    for (const scene of scenes) {
      expect(scene.title.length).toBeGreaterThan(0);
      expect(scene.emoji.length).toBeGreaterThan(0);
    }
  });

  it('every scene svg declares an 800x600 (4:3) viewBox', () => {
    for (const scene of scenes) {
      expect(scene.svg).toMatch(/viewBox="0 0 800 600"/);
      expect(scene.svg.trim().startsWith('<svg')).toBe(true);
    }
  });

  it('converts to a valid, decodable data: URI', () => {
    for (const scene of scenes) {
      const uri = sceneToDataUri(scene);
      expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
      const encoded = uri.slice('data:image/svg+xml;utf8,'.length);
      expect(decodeURIComponent(encoded)).toBe(scene.svg);
    }
  });
});
