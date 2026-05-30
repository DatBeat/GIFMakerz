import { useRef, useEffect, useState, useCallback } from 'react';
import { useGifStore } from '../stores/gifStore';
import { loadImage, computeHeight, drawImageToCanvas } from '../utils/imageUtils';
import { drawAllTextOverlays } from '../utils/textRenderer';
import { buildFramesWithTransitions } from '../utils/transitions';
import { estimateWeight } from '../utils/weightEstimator';
import SizeIndicator from './SizeIndicator';
import PreviewControls from './PreviewControls';

type SeqFrame = { canvas: HTMLCanvasElement; delay: number };

export default function Preview() {
  const frames = useGifStore((s) => s.frames);
  const settings = useGifStore((s) => s.settings);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0); // source-frame index (counter + manual step)
  const [seqIndex, setSeqIndex] = useState(0); // position within the full animated sequence
  const [canvasHeight, setCanvasHeight] = useState(400);
  const [sequence, setSequence] = useState<SeqFrame[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Number of transition frames inserted between two source frames — mirrors the
  // math in buildFramesWithTransitions so we can map a sequence index back to its
  // source frame. With no transition each source frame occupies one slot.
  const steps =
    settings.transition === 'none'
      ? 0
      : Math.max(1, Math.round(settings.transitionDuration / settings.frameDuration));
  const sourceStride = steps + 1;

  // Compute display height from first image
  useEffect(() => {
    if (frames.length === 0) return;
    loadImage(frames[0].url).then((img) => {
      setCanvasHeight(computeHeight(img, settings.outputWidth, settings.outputHeight));
    });
  }, [frames, settings.outputWidth, settings.outputHeight]);

  // Build the full animated sequence (source frames + in-between transition frames),
  // debounced so dragging sliders doesn't rebuild on every tick.
  useEffect(() => {
    if (frames.length === 0) {
      setSequence([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      const urls = frames.map((f) => f.url);
      const durations = frames.map((f) => f.duration);
      const overlays = frames.map((f) => f.textOverlays);

      let result: SeqFrame[];
      if (settings.transition !== 'none' && frames.length > 1) {
        result = await buildFramesWithTransitions(urls, {
          type: settings.transition,
          duration: settings.transitionDuration,
          frameDuration: settings.frameDuration,
          width: settings.outputWidth,
          height: canvasHeight,
          frameDurations: durations,
          frameTextOverlays: overlays,
        });
      } else {
        result = [];
        for (let i = 0; i < urls.length; i++) {
          const img = await loadImage(urls[i]);
          const canvas = drawImageToCanvas(img, settings.outputWidth, canvasHeight);
          if (overlays[i]) {
            const ctx = canvas.getContext('2d')!;
            drawAllTextOverlays(ctx, overlays[i], settings.outputWidth, canvasHeight);
          }
          result.push({ canvas, delay: durations[i] ?? settings.frameDuration });
        }
      }

      if (!cancelled) setSequence(result);
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [
    frames,
    settings.transition,
    settings.transitionDuration,
    settings.frameDuration,
    settings.outputWidth,
    canvasHeight,
  ]);

  // Draw a pre-rendered sequence frame onto the display canvas
  const drawSeq = useCallback(
    (i: number) => {
      const canvas = canvasRef.current;
      if (!canvas || sequence.length === 0) return;
      const ctx = canvas.getContext('2d')!;
      canvas.width = settings.outputWidth;
      canvas.height = canvasHeight;
      const src = sequence[Math.min(i, sequence.length - 1)];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(src.canvas, 0, 0);
    },
    [sequence, settings.outputWidth, canvasHeight]
  );

  // Animation loop over the full sequence; keeps the source-frame counter in sync.
  useEffect(() => {
    if (sequence.length === 0) return;
    const idx = Math.min(seqIndex, sequence.length - 1);
    drawSeq(idx);
    setCurrentFrame(Math.min(frames.length - 1, Math.floor(idx / sourceStride)));

    if (isPlaying && sequence.length > 1) {
      timerRef.current = setTimeout(() => {
        setSeqIndex((prev) => (prev + 1) % sequence.length);
      }, sequence[idx].delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [seqIndex, isPlaying, sequence, drawSeq, sourceStride, frames.length]);

  // Reset playback when the number of frames changes
  useEffect(() => {
    setSeqIndex(0);
    setCurrentFrame(0);
  }, [frames.length]);

  if (frames.length === 0) return null;

  // Manual stepping operates on SOURCE frames (jumps to that frame's sequence slot).
  const stepToSource = (src: number) => {
    const clamped = (src + frames.length) % frames.length;
    setCurrentFrame(clamped);
    setSeqIndex(Math.min(clamped * sourceStride, Math.max(0, sequence.length - 1)));
  };

  const estimatedBytes = estimateWeight(
    settings.outputWidth,
    canvasHeight,
    frames.length,
    settings.quality,
    settings.colorCount,
    settings.encoder
  );

  // Total duration reflects the real output: source delays + transition-frame delays.
  const totalDuration =
    sequence.length > 0
      ? sequence.reduce((sum, f) => sum + f.delay, 0)
      : frames.reduce((sum, f) => sum + (f.duration ?? settings.frameDuration), 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Prévisualisation</h3>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 inline-block">
          <canvas
            ref={canvasRef}
            className="block max-w-full h-auto"
            style={{ maxHeight: '400px' }}
          />
        </div>

        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 min-w-[180px]">
          <div className="flex items-center justify-between">
            <span>Dimensions</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">{settings.outputWidth} &times; {canvasHeight}px</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Poids estimé</span>
            <SizeIndicator bytes={estimatedBytes} />
          </div>
          <div className="flex items-center justify-between">
            <span>Frames</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">{frames.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Durée</span>
            <span className="font-mono text-gray-900 dark:text-gray-100">{(totalDuration / 1000).toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <PreviewControls
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onPrevFrame={() => stepToSource(currentFrame - 1)}
          onNextFrame={() => stepToSource(currentFrame + 1)}
          currentFrame={currentFrame}
          totalFrames={frames.length}
        />
      </div>
    </div>
  );
}
