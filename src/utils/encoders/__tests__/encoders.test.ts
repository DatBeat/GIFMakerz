import { describe, it, expect, vi } from 'vitest';

// Neutralize the WASM module so importing the registry never loads gifski wasm.
vi.mock('gifski-wasm', () => ({ default: vi.fn() }));

import { encoders } from '../index';
import { fastEncoder } from '../gifenc';
import type { FrameData, EncodeOpts } from '../index';

describe('encoder registry', () => {
  it('maps fast -> fastEncoder', () => {
    expect(encoders.fast.id).toBe('fast');
  });

  it('maps quality -> qualityEncoder', () => {
    expect(encoders.quality.id).toBe('quality');
  });
});

function makeFrame(w: number, h: number, delay: number): FrameData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;     // R
    data[i + 1] = 0;   // G
    data[i + 2] = 0;   // B
    data[i + 3] = 255; // A
  }
  return { data, width: w, height: h, delay };
}

const opts: EncodeOpts = {
  width: 2,
  height: 2,
  repeat: 0,
  colorCount: 128,
  quality: 'medium',
};

describe('fastEncoder (gifenc)', () => {
  it('produces a valid animated GIF blob', async () => {
    const frames = [makeFrame(2, 2, 100), makeFrame(2, 2, 100)];
    const onProgress = vi.fn();
    const blob = await fastEncoder.encode(frames, opts, onProgress);

    expect(blob.type).toBe('image/gif');
    expect(blob.size).toBeGreaterThan(0);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2])).toBe('GIF');

    expect(onProgress).toHaveBeenCalledWith(1);
  });
});
