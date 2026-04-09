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
