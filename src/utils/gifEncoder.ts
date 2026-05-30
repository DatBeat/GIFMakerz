// src/utils/gifEncoder.ts
import type { GifSettings, GifMetadata, TextOverlay } from '../types';
import { loadImage, drawImageToCanvas, computeHeight } from './imageUtils';
import { drawAllTextOverlays } from './textRenderer';
import { buildFramesWithTransitions } from './transitions';
import { encoders } from './encoders';
import type { FrameData } from './encoders';

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

export interface EncodeResult {
  blob: Blob;
  metadata: GifMetadata;
}

// Build the resized canvases (with transitions + text overlays) for each frame.
async function buildFrames(
  imageUrls: string[],
  settings: GifSettings,
  height: number,
  frameDurations?: (number | undefined)[],
  frameTextOverlays?: (TextOverlay[] | undefined)[]
): Promise<{ canvas: HTMLCanvasElement; delay: number }[]> {
  if (settings.transition !== 'none') {
    return buildFramesWithTransitions(imageUrls, {
      type: settings.transition,
      duration: settings.transitionDuration,
      frameDuration: settings.frameDuration,
      width: settings.outputWidth,
      height,
      frameDurations,
      frameTextOverlays,
    });
  }

  const canvases: { canvas: HTMLCanvasElement; delay: number }[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const img = await loadImage(imageUrls[i]);
    const canvas = drawImageToCanvas(img, settings.outputWidth, height);
    if (frameTextOverlays?.[i]) {
      const ctx = canvas.getContext('2d')!;
      drawAllTextOverlays(ctx, frameTextOverlays[i]!, settings.outputWidth, height);
    }
    canvases.push({ canvas, delay: frameDurations?.[i] ?? settings.frameDuration });
  }
  return canvases;
}

function canvasToFrameData(
  canvas: HTMLCanvasElement,
  delay: number
): FrameData {
  const ctx = canvas.getContext('2d')!;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data, width, height, delay };
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

  const canvasFrames = await buildFrames(
    imageUrls,
    settings,
    height,
    frameDurations,
    frameTextOverlays
  );

  const frames: FrameData[] = canvasFrames.map((cf) =>
    canvasToFrameData(cf.canvas, cf.delay)
  );

  const encoder = encoders[settings.encoder];
  const blob = await encoder.encode(
    frames,
    {
      width: settings.outputWidth,
      height,
      repeat: getRepeatValue(settings),
      colorCount: settings.colorCount,
      quality: settings.quality,
    },
    onProgress
  );

  const totalDuration = frames.reduce((sum, f) => sum + f.delay, 0);
  return {
    blob,
    metadata: {
      size: blob.size,
      width: settings.outputWidth,
      height,
      frameCount: frames.length,
      totalDuration,
    },
  };
}
