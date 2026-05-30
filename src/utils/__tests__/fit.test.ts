import { describe, it, expect } from 'vitest';
import { computeFitRect } from '../fit';

// source 400x500 (portrait, ratio 0.8) into output 600x400 (landscape, ratio 1.5)
describe('computeFitRect', () => {
  it('fill stretches to the full output', () => {
    expect(computeFitRect(400, 500, 600, 400, 'fill')).toEqual({ dx: 0, dy: 0, dWidth: 600, dHeight: 400 });
  });

  it('contain fits the whole image with side bands', () => {
    expect(computeFitRect(400, 500, 600, 400, 'contain')).toEqual({ dx: 140, dy: 0, dWidth: 320, dHeight: 400 });
  });

  it('cover fills the output and overflows vertically', () => {
    expect(computeFitRect(400, 500, 600, 400, 'cover')).toEqual({ dx: 0, dy: -175, dWidth: 600, dHeight: 750 });
  });

  it('custom scale doubles the cover size', () => {
    const r = computeFitRect(400, 500, 600, 400, 'custom', { scale: 2, offsetX: 0, offsetY: 0 });
    expect(r.dWidth).toBe(1200);
    expect(r.dHeight).toBe(1500);
    expect(r.dx).toBe(-300); // centered at scale 2
  });

  it('offsetX shifts within the overflow', () => {
    // scale=2 produces horizontal overflow so offsetX can shift dx
    const centered = computeFitRect(400, 500, 600, 400, 'custom', { scale: 2, offsetX: 0, offsetY: 0 });
    const shifted = computeFitRect(400, 500, 600, 400, 'custom', { scale: 2, offsetX: 1, offsetY: 0 });
    expect(shifted.dx).toBeGreaterThan(centered.dx);
  });
});
