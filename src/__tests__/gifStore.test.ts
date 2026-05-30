import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGifStore } from '../stores/gifStore';

// Mock URL.createObjectURL and URL.revokeObjectURL for jsdom
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (typeof URL.revokeObjectURL === 'undefined') {
  URL.revokeObjectURL = vi.fn();
}

function createMockFile(name: string): File {
  return new File(['dummy'], name, { type: 'image/png' });
}

describe('gifStore', () => {
  beforeEach(() => {
    useGifStore.getState().reset();
  });

  describe('frames', () => {
    it('starts with empty frames', () => {
      expect(useGifStore.getState().frames).toEqual([]);
    });

    it('adds frames from files', () => {
      const files = [createMockFile('a.png'), createMockFile('b.png')];
      useGifStore.getState().addFrames(files);
      const frames = useGifStore.getState().frames;
      expect(frames).toHaveLength(2);
      expect(frames[0].name).toBe('a.png');
      expect(frames[1].name).toBe('b.png');
    });

    it('limits to 20 frames total', () => {
      const files = Array.from({ length: 25 }, (_, i) => createMockFile(`img${i}.png`));
      useGifStore.getState().addFrames(files);
      expect(useGifStore.getState().frames).toHaveLength(20);
    });

    it('removes a frame by id', () => {
      useGifStore.getState().addFrames([createMockFile('a.png'), createMockFile('b.png')]);
      const id = useGifStore.getState().frames[0].id;
      useGifStore.getState().removeFrame(id);
      expect(useGifStore.getState().frames).toHaveLength(1);
      expect(useGifStore.getState().frames[0].name).toBe('b.png');
    });

    it('reorders frames', () => {
      useGifStore.getState().addFrames([
        createMockFile('a.png'),
        createMockFile('b.png'),
        createMockFile('c.png'),
      ]);
      useGifStore.getState().reorderFrames(0, 2);
      const names = useGifStore.getState().frames.map((f) => f.name);
      expect(names).toEqual(['b.png', 'c.png', 'a.png']);
    });
  });

  describe('settings', () => {
    it('has correct defaults', () => {
      const s = useGifStore.getState().settings;
      expect(s.frameDuration).toBe(500);
      expect(s.outputWidth).toBe(600);
      expect(s.quality).toBe('medium');
      expect(s.loop).toBe('infinite');
      expect(s.transition).toBe('none');
      expect(s.dithering).toBe('FloydSteinberg');
      expect(s.colorCount).toBe(128);
      expect(s.encodingSpeed).toBe(5);
      expect(s.encoder).toBe('fast');
    });

    it('updates partial settings', () => {
      useGifStore.getState().updateSettings({ frameDuration: 1000, quality: 'high' });
      const s = useGifStore.getState().settings;
      expect(s.frameDuration).toBe(1000);
      expect(s.quality).toBe('high');
      expect(s.outputWidth).toBe(600);
    });

    it('applies a preset', () => {
      useGifStore.getState().applyPreset({
        name: 'cta',
        label: 'CTA animé',
        width: 200,
        quality: 'medium',
        maxFileSize: 250,
        description: 'Bouton',
      });
      const s = useGifStore.getState().settings;
      expect(s.outputWidth).toBe(200);
      expect(s.quality).toBe('medium');
      expect(s.maxFileSize).toBe(250);
    });
  });

  describe('per-frame duration', () => {
    it('updates individual frame duration', () => {
      useGifStore.getState().addFrames([createMockFile('a.png')]);
      const id = useGifStore.getState().frames[0].id;
      useGifStore.getState().updateFrameDuration(id, 1000);
      expect(useGifStore.getState().frames[0].duration).toBe(1000);
    });

    it('clears individual frame duration', () => {
      useGifStore.getState().addFrames([createMockFile('a.png')]);
      const id = useGifStore.getState().frames[0].id;
      useGifStore.getState().updateFrameDuration(id, 1000);
      useGifStore.getState().updateFrameDuration(id, undefined);
      expect(useGifStore.getState().frames[0].duration).toBeUndefined();
    });
  });

  describe('per-frame fit', () => {
    it('new frames default to cover', () => {
      useGifStore.getState().addFrames([createMockFile('a.png')]);
      expect(useGifStore.getState().frames[0].fit).toBe('cover');
    });

    it('updates a single frame fit', () => {
      useGifStore.getState().addFrames([createMockFile('a.png'), createMockFile('b.png')]);
      const id = useGifStore.getState().frames[0].id;
      useGifStore.getState().updateFrameFit(id, { fit: 'contain', background: { type: 'blur' } });
      const f = useGifStore.getState().frames[0];
      expect(f.fit).toBe('contain');
      expect(f.background).toEqual({ type: 'blur' });
      expect(useGifStore.getState().frames[1].fit).toBe('cover');
    });

    it('applies a fit to all frames', () => {
      useGifStore.getState().addFrames([createMockFile('a.png'), createMockFile('b.png')]);
      useGifStore.getState().applyFitToAll({ fit: 'fill' });
      expect(useGifStore.getState().frames.every((f) => f.fit === 'fill')).toBe(true);
    });
  });

  describe('generation state', () => {
    it('tracks generating state', () => {
      useGifStore.getState().setGenerating(true);
      expect(useGifStore.getState().isGenerating).toBe(true);
    });

    it('tracks progress', () => {
      useGifStore.getState().setProgress(0.5);
      expect(useGifStore.getState().progress).toBe(0.5);
    });

    it('resets everything', () => {
      useGifStore.getState().addFrames([createMockFile('a.png')]);
      useGifStore.getState().setGenerating(true);
      useGifStore.getState().reset();
      expect(useGifStore.getState().frames).toEqual([]);
      expect(useGifStore.getState().isGenerating).toBe(false);
    });
  });
});
