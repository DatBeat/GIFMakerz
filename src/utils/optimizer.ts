import { estimateWeight } from './weightEstimator';
import type { GifSettings, Quality } from '../types';

interface OptimizationResult {
  colorCount: number;
  quality: Quality;
  outputWidth: number;
}

export function optimizeForTargetSize(
  currentSettings: GifSettings,
  targetKB: number,
  frameCount: number,
  imageAspectRatio: number
): OptimizationResult {
  const targetBytes = targetKB * 1024;
  let colorCount = currentSettings.colorCount;
  let quality: Quality = currentSettings.quality;
  let outputWidth = currentSettings.outputWidth;

  // Helper to compute height from width
  const getHeight = (w: number) => Math.round(w * imageAspectRatio);

  // Step 1: Reduce colors first (least visual impact)
  const colorSteps = [256, 128, 64, 32, 16];
  for (const c of colorSteps) {
    if (c > colorCount) continue;
    colorCount = c;
    const height = getHeight(outputWidth);
    if (estimateWeight(outputWidth, height, frameCount, quality, colorCount) <= targetBytes) {
      return { colorCount, quality, outputWidth };
    }
  }

  // Step 2: Reduce quality
  const qualitySteps: Quality[] = ['high', 'medium', 'low'];
  for (const q of qualitySteps) {
    quality = q;
    const height = getHeight(outputWidth);
    if (estimateWeight(outputWidth, height, frameCount, quality, colorCount) <= targetBytes) {
      return { colorCount, quality, outputWidth };
    }
  }

  // Step 3: Reduce width (10% decrements, min 200px)
  while (outputWidth > 200) {
    outputWidth = Math.max(200, outputWidth - Math.round(outputWidth * 0.1));
    const height = getHeight(outputWidth);
    if (estimateWeight(outputWidth, height, frameCount, quality, colorCount) <= targetBytes) {
      return { colorCount, quality, outputWidth };
    }
  }

  // Return best effort
  return { colorCount, quality, outputWidth };
}
