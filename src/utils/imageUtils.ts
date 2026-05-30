import type { FitMode, FrameTransform, FrameBackground } from '../types';
import { computeFitRect } from './fit';

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function drawImageToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

export function computeHeight(
  img: HTMLImageElement,
  targetWidth: number,
  forcedHeight: number | 'auto'
): number {
  if (forcedHeight !== 'auto') return forcedHeight;
  return Math.round((img.naturalHeight / img.naturalWidth) * targetWidth);
}

export interface FitDrawOptions {
  fit: FitMode;
  transform?: FrameTransform;
  background?: FrameBackground;
  width: number;
  height: number;
}

// Draw an image into the output box honoring its fit mode.
export function drawImageWithFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  opts: FitDrawOptions
): void {
  const { fit, transform, background, width, height } = opts;
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  ctx.clearRect(0, 0, width, height);

  if (fit === 'tile') {
    // Mosaic: scale the source so several copies fit, then repeat-fill.
    const tileH = Math.max(1, Math.round(height / 2));
    const tileW = Math.max(1, Math.round((srcW / srcH) * tileH));
    const tile = document.createElement('canvas');
    tile.width = tileW;
    tile.height = tileH;
    tile.getContext('2d')!.drawImage(img, 0, 0, tileW, tileH);
    const pattern = ctx.createPattern(tile, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }
    return;
  }

  if (fit === 'contain') {
    if (background?.type === 'blur') {
      ctx.save();
      ctx.filter = 'blur(20px)';
      const cover = computeFitRect(srcW, srcH, width, height, 'cover');
      // oversize slightly so the blur doesn't leave transparent edges
      ctx.drawImage(img, cover.dx - 20, cover.dy - 20, cover.dWidth + 40, cover.dHeight + 40);
      ctx.restore();
    } else {
      ctx.fillStyle = (background?.type === 'color' ? background.color : null) ?? '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
  }

  const rect = computeFitRect(srcW, srcH, width, height, fit, transform);
  ctx.drawImage(img, rect.dx, rect.dy, rect.dWidth, rect.dHeight);
}

// Convenience: build a fit-rendered canvas at the output size.
export function drawImageToFitCanvas(
  img: HTMLImageElement,
  opts: FitDrawOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext('2d')!;
  drawImageWithFit(ctx, img, opts);
  return canvas;
}
