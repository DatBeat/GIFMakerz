import { describe, it, expect } from 'vitest';
import { optimizeForTargetSize } from '../utils/optimizer';
import type { GifSettings } from '../types';

function makeSettings(partial: Partial<GifSettings>): GifSettings {
  return {
    frameDuration: 500,
    outputWidth: 600,
    quality: 'high',
    loop: 'infinite',
    customLoopCount: 1,
    transition: 'none',
    transitionDuration: 300,
    outputHeight: 'auto',
    maxFileSize: 500,
    dithering: 'FloydSteinberg',
    colorCount: 256,
    encodingSpeed: 5,
    encoder: 'fast',
    ...partial,
  };
}

describe('optimizeForTargetSize — encoder awareness', () => {
  it('Fast encoder reduces colorCount to hit the target', () => {
    const s = makeSettings({ encoder: 'fast', colorCount: 256, quality: 'high' });
    const r = optimizeForTargetSize(s, 250, 10, 1); // square, 10 frames → heavy
    expect(r.colorCount).toBeLessThan(256);
  });

  it('Quality encoder leaves colorCount untouched (gifski ignores it)', () => {
    const s = makeSettings({ encoder: 'quality', colorCount: 256, quality: 'high' });
    const r = optimizeForTargetSize(s, 250, 10, 1);
    expect(r.colorCount).toBe(256); // optimizes via quality/width instead of colors
  });
});
