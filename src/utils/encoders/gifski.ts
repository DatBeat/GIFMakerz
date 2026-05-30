import encode from 'gifski-wasm';
import type { Encoder } from './index';
import type { Quality } from '../../types';

function gifskiQuality(q: Quality): number {
  switch (q) {
    case 'low':
      return 50;
    case 'medium':
      return 80;
    case 'high':
      return 100;
  }
}

// High-quality email deliverable encoder. gifski handles palette and dithering
// internally; `quality` (1-100) trades file size against fidelity.
export const qualityEncoder: Encoder = {
  id: 'quality',
  async encode(frames, opts, onProgress) {
    onProgress(0.1);

    const frameBuffers = frames.map(
      (f) => new Uint8Array(f.data.buffer, f.data.byteOffset, f.data.byteLength)
    );
    const frameDurations = frames.map((f) => f.delay);

    const output = await encode({
      frames: frameBuffers,
      width: opts.width,
      height: opts.height,
      frameDurations,
      quality: gifskiQuality(opts.quality),
      repeat: opts.repeat,
    });

    onProgress(1);
    return new Blob([output as Uint8Array<ArrayBuffer>], { type: 'image/gif' });
  },
};
