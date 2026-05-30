// src/components/GenerateButton.tsx
import { useState } from 'react';
import { useGifStore } from '../stores/gifStore';
import { encodeGif } from '../utils/gifEncoder';

export default function GenerateButton() {
  const [error, setError] = useState<string | null>(null);
  const frames = useGifStore((s) => s.frames);
  const settings = useGifStore((s) => s.settings);
  const isGenerating = useGifStore((s) => s.isGenerating);
  const progress = useGifStore((s) => s.progress);
  const setGenerating = useGifStore((s) => s.setGenerating);
  const setProgress = useGifStore((s) => s.setProgress);
  const setGeneratedGif = useGifStore((s) => s.setGeneratedGif);

  const canGenerate = frames.length >= 2 && !isGenerating;

  async function handleGenerate() {
    if (!canGenerate) return;
    setError(null);
    setGenerating(true);
    setProgress(0);
    setGeneratedGif(null, null);

    try {
      const urls = frames.map((f) => f.url);
      const frameDurations = frames.map((f) => f.duration);
      const frameTextOverlays = frames.map((f) => f.textOverlays);
      const result = await encodeGif(urls, settings, (p) => setProgress(p), frameDurations, frameTextOverlays);
      setGeneratedGif(result.blob, result.metadata);
    } catch (err) {
      console.error('GIF encoding failed:', err);
      setError(err instanceof Error ? err.message : "Échec de l'encodage du GIF.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className={`w-full py-3 px-6 rounded-xl text-white font-semibold text-base transition-all ${
          canGenerate
            ? 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg'
            : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
        }`}
      >
        {isGenerating ? 'Encodage en cours...' : 'Générer le GIF'}
      </button>

      {isGenerating && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-200"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {frames.length < 2 && frames.length > 0 && (
        <p className="text-xs text-amber-600 mt-2 text-center">
          Ajoutez au moins 2 images pour générer un GIF
        </p>
      )}

      {error && !isGenerating && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
