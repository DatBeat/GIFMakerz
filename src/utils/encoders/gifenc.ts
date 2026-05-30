import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import type { Encoder } from './index';

// Fast preview encoder. Per-frame local palettes for accuracy; gifenc has no
// dithering or speed knobs, so `dithering`/`encodingSpeed` settings are ignored.
export const fastEncoder: Encoder = {
  id: 'fast',
  async encode(frames, opts, onProgress) {
    const gif = GIFEncoder();

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const palette = quantize(f.data, opts.colorCount);
      const index = applyPalette(f.data, palette);
      gif.writeFrame(index, f.width, f.height, {
        palette,
        delay: f.delay,
        // Loop block is written from the first frame only.
        repeat: i === 0 ? opts.repeat : undefined,
      });
      onProgress(((i + 1) / frames.length) * 0.95);
      // Yield to the event loop so the UI/progress bar can update.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    gif.finish();
    onProgress(1);
    return new Blob([gif.bytes()], { type: 'image/gif' });
  },
};
