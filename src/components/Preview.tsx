import { useRef, useEffect, useState, useCallback } from 'react';
import { useGifStore } from '../stores/gifStore';
import { loadImage, computeHeight } from '../utils/imageUtils';
import { estimateWeight } from '../utils/weightEstimator';
import SizeIndicator from './SizeIndicator';
import PreviewControls from './PreviewControls';

export default function Preview() {
  const frames = useGifStore((s) => s.frames);
  const settings = useGifStore((s) => s.settings);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Compute display height from first image
  useEffect(() => {
    if (frames.length === 0) return;
    loadImage(frames[0].url).then((img) => {
      const h = computeHeight(img, settings.outputWidth, settings.outputHeight);
      setCanvasHeight(h);
    });
  }, [frames, settings.outputWidth, settings.outputHeight]);

  // Draw current frame onto canvas
  const drawFrame = useCallback(
    async (index: number) => {
      if (!canvasRef.current || frames.length === 0) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      canvas.width = settings.outputWidth;
      canvas.height = canvasHeight;

      const img = await loadImage(frames[index].url);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    },
    [frames, settings.outputWidth, canvasHeight]
  );

  // Animation loop
  useEffect(() => {
    if (frames.length === 0) return;
    drawFrame(currentFrame);

    if (isPlaying && frames.length > 1) {
      timerRef.current = setTimeout(() => {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
      }, settings.frameDuration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentFrame, isPlaying, frames, settings.frameDuration, drawFrame]);

  // Reset frame index when frames change
  useEffect(() => {
    setCurrentFrame(0);
  }, [frames.length]);

  if (frames.length === 0) return null;

  const estimatedBytes = estimateWeight(
    settings.outputWidth,
    canvasHeight,
    frames.length,
    settings.quality,
    settings.colorCount
  );

  const totalDuration = frames.length * settings.frameDuration;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Prévisualisation</h3>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white inline-block">
          <canvas
            ref={canvasRef}
            className="block max-w-full h-auto"
            style={{ maxHeight: '400px' }}
          />
        </div>

        <div className="space-y-3 text-sm text-gray-600 min-w-[180px]">
          <div className="flex items-center justify-between">
            <span>Dimensions</span>
            <span className="font-mono text-gray-900">{settings.outputWidth} &times; {canvasHeight}px</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Poids estimé</span>
            <SizeIndicator bytes={estimatedBytes} />
          </div>
          <div className="flex items-center justify-between">
            <span>Frames</span>
            <span className="font-mono text-gray-900">{frames.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Durée</span>
            <span className="font-mono text-gray-900">{(totalDuration / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <PreviewControls
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onPrevFrame={() => setCurrentFrame((p) => (p - 1 + frames.length) % frames.length)}
          onNextFrame={() => setCurrentFrame((p) => (p + 1) % frames.length)}
          currentFrame={currentFrame}
          totalFrames={frames.length}
        />
      </div>
    </div>
  );
}
