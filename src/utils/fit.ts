import type { FitMode, FrameTransform } from '../types';

export interface FitRect {
  dx: number;
  dy: number;
  dWidth: number;
  dHeight: number;
}

// Destination rect to draw the source into the output box.
// Handles fill | contain | cover | custom. (tile is handled by the renderer.)
export function computeFitRect(
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
  fit: FitMode,
  transform?: FrameTransform
): FitRect {
  // tile has no single destination rect — it is repeat-filled by the renderer.
  if (fit === 'tile') {
    throw new Error('computeFitRect: tile mode is handled by the renderer, not here');
  }

  if (fit === 'fill') {
    return { dx: 0, dy: 0, dWidth: outW, dHeight: outH };
  }

  const srcRatio = srcW / srcH;
  const outRatio = outW / outH;

  if (fit === 'contain') {
    let dWidth: number;
    let dHeight: number;
    if (srcRatio > outRatio) {
      dWidth = outW;
      dHeight = outW / srcRatio;
    } else {
      dHeight = outH;
      dWidth = outH * srcRatio;
    }
    return { dx: (outW - dWidth) / 2, dy: (outH - dHeight) / 2, dWidth, dHeight };
  }

  // cover / custom: base cover scale, then transform scale + normalized pan
  let baseW: number;
  let baseH: number;
  if (srcRatio > outRatio) {
    baseH = outH;
    baseW = outH * srcRatio;
  } else {
    baseW = outW;
    baseH = outW / srcRatio;
  }
  const scale = transform?.scale ?? 1;
  const dWidth = baseW * scale;
  const dHeight = baseH * scale;
  const overflowX = (dWidth - outW) / 2;
  const overflowY = (dHeight - outH) / 2;
  const offX = transform?.offsetX ?? 0;
  const offY = transform?.offsetY ?? 0;
  const dx = (outW - dWidth) / 2 + overflowX * offX;
  const dy = (outH - dHeight) / 2 + overflowY * offY;
  return { dx, dy, dWidth, dHeight };
}
