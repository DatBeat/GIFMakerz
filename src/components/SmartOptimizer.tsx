import { useState } from 'react';
import { useGifStore } from '../stores/gifStore';
import { optimizeForTargetSize } from '../utils/optimizer';
import { loadImage, computeHeight } from '../utils/imageUtils';
import { estimateWeight, formatSize } from '../utils/weightEstimator';

export default function SmartOptimizer() {
  const frames = useGifStore((s) => s.frames);
  const settings = useGifStore((s) => s.settings);
  const updateSettings = useGifStore((s) => s.updateSettings);
  const [target, setTarget] = useState(500);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (frames.length === 0) return null;

  async function handleOptimize() {
    setOptimizing(true);
    setResult(null);

    try {
      const img = await loadImage(frames[0].url);
      const aspectRatio = img.naturalHeight / img.naturalWidth;
      const currentHeight = computeHeight(img, settings.outputWidth, settings.outputHeight);

      const currentEstimate = estimateWeight(settings.outputWidth, currentHeight, frames.length, settings.quality, settings.colorCount);

      if (currentEstimate <= target * 1024) {
        setResult(`Déjà optimisé ! (~${formatSize(currentEstimate)})`);
        setOptimizing(false);
        return;
      }

      const optimized = optimizeForTargetSize(settings, target, frames.length, aspectRatio);

      updateSettings({
        colorCount: optimized.colorCount,
        quality: optimized.quality,
        outputWidth: optimized.outputWidth,
      });

      const newHeight = Math.round(optimized.outputWidth * aspectRatio);
      const newEstimate = estimateWeight(optimized.outputWidth, newHeight, frames.length, optimized.quality, optimized.colorCount);
      setResult(`Optimisé → ~${formatSize(newEstimate)}`);
    } catch {
      setResult('Erreur lors de l\'optimisation');
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600 dark:text-gray-300">Optimiser pour</span>
      <select
        value={target}
        onChange={(e) => { setTarget(Number(e.target.value)); setResult(null); }}
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value={250}>250 KB</option>
        <option value={500}>500 KB</option>
        <option value={1000}>1 MB</option>
      </select>
      <button
        onClick={handleOptimize}
        disabled={optimizing}
        className="px-3 py-1 text-sm rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
      >
        {optimizing ? '...' : '⚡ Optimiser'}
      </button>
      {result && (
        <span className="text-xs text-green-600 dark:text-green-400 font-medium">{result}</span>
      )}
    </div>
  );
}
