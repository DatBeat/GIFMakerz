// src/utils/gifEncoder.ts
import GIF from 'gif.js';
import type { GifSettings, GifMetadata, TextOverlay } from '../types';
import { loadImage, drawImageToCanvas, computeHeight } from './imageUtils';
import { drawAllTextOverlays } from './textRenderer';
import { buildFramesWithTransitions } from './transitions';

function getRepeatValue(settings: GifSettings): number {
  switch (settings.loop) {
    case 'infinite': return 0;
    case '1': return 1;
    case '2': return 2;
    case '3': return 3;
    case 'custom': return settings.customLoopCount;
    default: return 0;
  }
}

function getGifQuality(settings: GifSettings): number {
  // gif.js quality: 1 = best, 20 = worst
  switch (settings.quality) {
    case 'high': return 1;
    case 'medium': return 10;
    case 'low': return 20;
  }
}

function getDither(settings: GifSettings): boolean | string {
  switch (settings.dithering) {
    case 'none': return false;
    case 'FloydSteinberg': return 'FloydSteinberg';
    case 'ordered': return 'Stucki';
    default: return false;
  }
}

export interface EncodeResult {
  blob: Blob;
  metadata: GifMetadata;
}

export async function encodeGif(
  imageUrls: string[],
  settings: GifSettings,
  onProgress: (progress: number) => void,
  frameDurations?: (number | undefined)[],
  frameTextOverlays?: (TextOverlay[] | undefined)[]
): Promise<EncodeResult> {
  const firstImg = await loadImage(imageUrls[0]);
  const height = computeHeight(firstImg, settings.outputWidth, settings.outputHeight);

  let frames: { canvas: HTMLCanvasElement; delay: number }[];

  if (settings.transition !== 'none') {
    frames = await buildFramesWithTransitions(imageUrls, {
      type: settings.transition,
      duration: settings.transitionDuration,
      frameDuration: settings.frameDuration,
      width: settings.outputWidth,
      height,
      frameDurations,
      frameTextOverlays,
    });
  } else {
    const canvases: { canvas: HTMLCanvasElement; delay: number }[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const img = await loadImage(imageUrls[i]);
      const canvas = drawImageToCanvas(img, settings.outputWidth, height);
      if (frameTextOverlays?.[i]) {
        const ctx = canvas.getContext('2d')!;
        drawAllTextOverlays(ctx, frameTextOverlays[i], settings.outputWidth, height);
      }
      canvases.push({ canvas, delay: frameDurations?.[i] ?? settings.frameDuration });
    }
    frames = canvases;
  }

  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: getGifQuality(settings),
      width: settings.outputWidth,
      height,
      workerScript: '/gif.worker.js',
      repeat: getRepeatValue(settings),
      dither: getDither(settings),
    });

    for (const frame of frames) {
      gif.addFrame(frame.canvas, { delay: frame.delay, copy: true });
    }

    gif.on('progress', onProgress);

    gif.on('finished', (blob: Blob) => {
      const totalDuration = frames.reduce((sum, f) => sum + f.delay, 0);
      resolve({
        blob,
        metadata: {
          size: blob.size,
          width: settings.outputWidth,
          height,
          frameCount: frames.length,
          totalDuration,
        },
      });
    });

    gif.on('abort', () => reject(new Error('Encoding aborted')));

    gif.render();
  });
}
