import type { TextOverlay } from '../types';

export function drawTextOverlay(
  ctx: CanvasRenderingContext2D,
  overlay: TextOverlay,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.save();

  const fontWeight = overlay.bold ? 'bold ' : '';
  ctx.font = `${fontWeight}${overlay.fontSize}px ${overlay.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  let y: number;
  switch (overlay.position) {
    case 'top':
      y = overlay.fontSize + 10;
      break;
    case 'center':
      y = canvasHeight / 2;
      break;
    case 'bottom':
      y = canvasHeight - overlay.fontSize - 10;
      break;
  }

  const x = canvasWidth / 2;
  const metrics = ctx.measureText(overlay.text);
  const padding = 6;

  if (overlay.backgroundColor && overlay.backgroundColor !== 'transparent') {
    ctx.fillStyle = overlay.backgroundColor;
    const textWidth = metrics.width;
    const textHeight = overlay.fontSize;
    ctx.fillRect(
      x - textWidth / 2 - padding,
      y - textHeight / 2 - padding,
      textWidth + padding * 2,
      textHeight + padding * 2
    );
  }

  ctx.fillStyle = overlay.color;
  ctx.fillText(overlay.text, x, y);

  ctx.restore();
}

export function drawAllTextOverlays(
  ctx: CanvasRenderingContext2D,
  overlays: TextOverlay[] | undefined,
  canvasWidth: number,
  canvasHeight: number
): void {
  if (!overlays) return;
  for (const overlay of overlays) {
    drawTextOverlay(ctx, overlay, canvasWidth, canvasHeight);
  }
}
