export function estimateWeight(
  width: number,
  height: number,
  frameCount: number,
  quality: 'low' | 'medium' | 'high',
  colorCount: number
): number {
  const qualityFactors = { low: 0.3, medium: 0.5, high: 0.8 };
  const colorFactor = colorCount / 256;
  const bytesPerPixel = qualityFactors[quality] * colorFactor;
  const rawSize = width * height * frameCount * bytesPerPixel;
  const compressionRatio = 0.4;
  return Math.round(rawSize * compressionRatio);
}

export function getSizeCategory(bytes: number): 'green' | 'orange' | 'red' {
  const kb = bytes / 1024;
  if (kb < 250) return 'green';
  if (kb <= 500) return 'orange';
  return 'red';
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)}KB`;
  return `${(kb / 1024).toFixed(1)}MB`;
}
