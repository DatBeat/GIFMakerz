import { describe, it, expect } from 'vitest';
import { presets } from '../utils/presets';

describe('presets', () => {
  it('contains 5 presets', () => {
    expect(presets).toHaveLength(5);
  });

  it('all presets have required fields', () => {
    for (const p of presets) {
      expect(p.name).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.width).toBeGreaterThanOrEqual(200);
      expect(p.width).toBeLessThanOrEqual(800);
      expect(['low', 'medium', 'high']).toContain(p.quality);
      expect(p.maxFileSize).toBeGreaterThan(0);
    }
  });

  it('includes hero, product, cta, countdown, carousel', () => {
    const names = presets.map((p) => p.name);
    expect(names).toContain('hero');
    expect(names).toContain('product');
    expect(names).toContain('cta');
    expect(names).toContain('countdown');
    expect(names).toContain('carousel');
  });
});
