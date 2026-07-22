import { describe, expect, it } from 'vitest';
import { scenes, sceneToDataUri } from './index';

describe('row-row scenes', () => {
  it('has exactly 3 scenes', () => {
    expect(scenes).toHaveLength(3);
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

  it('every scene svg declares an 800x450 (16:9) viewBox', () => {
    for (const scene of scenes) {
      expect(scene.svg).toMatch(/viewBox="0 0 800 450"/);
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
