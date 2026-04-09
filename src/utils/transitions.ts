import { loadImage, drawImageToCanvas } from './imageUtils';

export interface TransitionConfig {
  type: 'crossfade' | 'slide';
  duration: number;
  frameDuration: number;
  width: number;
  height: number;
}

function generateCrossfadeFrames(
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement,
  steps: number,
  width: number,
  height: number
): HTMLCanvasElement[] {
  const result: HTMLCanvasElement[] = [];
  for (let i = 1; i <= steps; i++) {
    const alpha = i / (steps + 1);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.globalAlpha = 1 - alpha;
    ctx.drawImage(fromCanvas, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(toCanvas, 0, 0);
    ctx.globalAlpha = 1;
    result.push(canvas);
  }
  return result;
}

function generateSlideFrames(
  fromCanvas: HTMLCanvasElement,
  toCanvas: HTMLCanvasElement,
  steps: number,
  width: number,
  height: number
): HTMLCanvasElement[] {
  const result: HTMLCanvasElement[] = [];
  for (let i = 1; i <= steps; i++) {
    const progress = i / (steps + 1);
    const offset = Math.round(width * progress);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(fromCanvas, -offset, 0);
    ctx.drawImage(toCanvas, width - offset, 0);
    result.push(canvas);
  }
  return result;
}

export async function buildFramesWithTransitions(
  imageUrls: string[],
  config: TransitionConfig
): Promise<{ canvas: HTMLCanvasElement; delay: number }[]> {
  const { type, duration, frameDuration, width, height } = config;
  const steps = Math.max(1, Math.round(duration / frameDuration));
  const transitionFrameDelay = Math.round(duration / steps);

  const canvases: HTMLCanvasElement[] = [];
  for (const url of imageUrls) {
    const img = await loadImage(url);
    canvases.push(drawImageToCanvas(img, width, height));
  }

  const result: { canvas: HTMLCanvasElement; delay: number }[] = [];

  for (let i = 0; i < canvases.length; i++) {
    result.push({ canvas: canvases[i], delay: frameDuration });

    if (i < canvases.length - 1) {
      const generator = type === 'crossfade' ? generateCrossfadeFrames : generateSlideFrames;
      const transitionFrames = generator(canvases[i], canvases[i + 1], steps, width, height);
      for (const frame of transitionFrames) {
        result.push({ canvas: frame, delay: transitionFrameDelay });
      }
    }
  }

  return result;
}
