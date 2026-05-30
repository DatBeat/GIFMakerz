import { describe, it, expect } from 'vitest';
import { estimateWeight, getSizeCategory, formatSize } from '../utils/weightEstimator';

describe('estimateWeight', () => {
  it('returns a positive number', () => {
    const weight = estimateWeight(600, 400, 4, 'medium', 128);
    expect(weight).toBeGreaterThan(0);
  });

  it('higher quality means larger file', () => {
    const low = estimateWeight(600, 400, 4, 'low', 128);
    const high = estimateWeight(600, 400, 4, 'high', 128);
    expect(high).toBeGreaterThan(low);
  });

  it('more frames means larger file', () => {
    const few = estimateWeight(600, 400, 2, 'medium', 128);
    const many = estimateWeight(600, 400, 10, 'medium', 128);
    expect(many).toBeGreaterThan(few);
  });

  it('more colors means larger file', () => {
    const small = estimateWeight(600, 400, 4, 'medium', 16);
    const large = estimateWeight(600, 400, 4, 'medium', 256);
    expect(large).toBeGreaterThan(small);
  });
});

describe('estimateWeight — encoder awareness', () => {
  it('Fast encoder: colorCount still affects the estimate', () => {
    const small = estimateWeight(600, 400, 4, 'medium', 16, 'fast');
    const large = estimateWeight(600, 400, 4, 'medium', 256, 'fast');
    expect(large).toBeGreaterThan(small);
  });

  it('Quality encoder: colorCount is ignored (gifski uses a full palette)', () => {
    const few = estimateWeight(600, 400, 4, 'medium', 16, 'quality');
    const many = estimateWeight(600, 400, 4, 'medium', 256, 'quality');
    expect(many).toBe(few);
  });

  it('switching encoder changes the estimate at the same low colorCount', () => {
    const fast = estimateWeight(600, 400, 4, 'medium', 64, 'fast');
    const quality = estimateWeight(600, 400, 4, 'medium', 64, 'quality');
    expect(quality).not.toBe(fast);
  });
});

describe('getSizeCategory', () => {
  it('returns green under 250KB', () => {
    expect(getSizeCategory(100 * 1024)).toBe('green');
  });

  it('returns orange between 250KB and 500KB', () => {
    expect(getSizeCategory(300 * 1024)).toBe('orange');
  });

  it('returns red above 500KB', () => {
    expect(getSizeCategory(600 * 1024)).toBe('red');
  });
});

describe('formatSize', () => {
  it('formats bytes', () => {
    expect(formatSize(500)).toBe('500B');
  });

  it('formats kilobytes', () => {
    expect(formatSize(1024 * 320)).toBe('320KB');
  });

  it('formats megabytes', () => {
    expect(formatSize(1024 * 1024 * 1.5)).toBe('1.5MB');
  });
});
