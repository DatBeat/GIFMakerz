import { useState, useRef } from 'react';
import { useGifStore } from '../stores/gifStore';
import { extractFramesFromVideo } from '../utils/videoExtractor';

export default function VideoImporter() {
  const addFrames = useGifStore((s) => s.addFrames);
  const [frameCount, setFrameCount] = useState(10);
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setIsExtracting(true);
    setProgress(0);
    setError(null);

    try {
      const frames = await extractFramesFromVideo(file, frameCount, setProgress);
      addFrames(frames);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'extraction');
    } finally {
      setIsExtracting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎥</span>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Importer depuis une vidéo</h3>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={isExtracting}
          className="text-sm text-gray-600 dark:text-gray-300 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 file:cursor-pointer hover:file:bg-blue-100 dark:hover:file:bg-blue-800/30 disabled:opacity-50"
        />
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 dark:text-gray-400">Frames:</label>
          <input
            type="range"
            min={5}
            max={30}
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
            className="w-20 accent-blue-600"
            disabled={isExtracting}
          />
          <span className="text-xs font-mono text-gray-700 dark:text-gray-300 w-6">{frameCount}</span>
        </div>
      </div>

      {isExtracting && (
        <div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Extraction: {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
