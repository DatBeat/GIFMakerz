import { useEffect, useRef, useState } from 'react';
import { useGifStore } from '../stores/gifStore';
import { loadImage, drawImageWithFit, computeHeight } from '../utils/imageUtils';
import type { FrameImage, FitMode, FrameTransform } from '../types';

interface Props {
  frame: FrameImage;
  onClose: () => void;
}

const PRESETS: { mode: FitMode; label: string }[] = [
  { mode: 'cover', label: 'Couvrir' },
  { mode: 'contain', label: 'Contenir' },
  { mode: 'fill', label: 'Remplir' },
  { mode: 'tile', label: 'Mosaïque' },
];

const DISPLAY_W = 460;

export default function FrameFitEditor({ frame, onClose }: Props) {
  const settings = useGifStore((s) => s.settings);
  const updateFrameFit = useGifStore((s) => s.updateFrameFit);
  const applyFitToAll = useGifStore((s) => s.applyFitToAll);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [fit, setFit] = useState<FitMode>(frame.fit);
  const [transform, setTransform] = useState<FrameTransform>(
    frame.transform ?? { scale: 1, offsetX: 0, offsetY: 0 }
  );
  const [background, setBackground] = useState(frame.background ?? { type: 'color' as const, color: '#ffffff' });
  const [outH, setOutH] = useState(400);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Display canvas keeps the output aspect ratio.
  const displayH = Math.round((outH / settings.outputWidth) * DISPLAY_W);
  const isManual = fit === 'cover' || fit === 'custom';

  useEffect(() => {
    setImageLoaded(false);
    loadImage(frame.url).then((img) => {
      imgRef.current = img;
      setOutH(computeHeight(img, settings.outputWidth, settings.outputHeight));
      setImageLoaded(true); // forces a re-render even if outH is unchanged
    });
  }, [frame.url, settings.outputWidth, settings.outputHeight]);

  // Re-render the editor canvas whenever the fit state (or the loaded image) changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = DISPLAY_W;
    canvas.height = displayH;
    const ctx = canvas.getContext('2d')!;
    drawImageWithFit(ctx, img, { fit, transform, background, width: DISPLAY_W, height: displayH });
  }, [fit, transform, background, displayH, imageLoaded]);

  // Non-passive wheel listener so zoom can preventDefault page scroll
  // (React's synthetic onWheel is passive since v17 → preventDefault is a no-op).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (e: WheelEvent) => {
      if (!isManual) return;
      e.preventDefault();
      setFit('custom');
      setTransform((t) => ({
        ...t,
        scale: Math.max(1, Math.min(5, t.scale - e.deltaY * 0.001)),
      }));
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [isManual, displayH]);

  function selectPreset(mode: FitMode) {
    setFit(mode);
    if (mode === 'cover') setTransform({ scale: 1, offsetX: 0, offsetY: 0 });
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!isManual) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current || !isManual) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setFit('custom');
    setTransform((t) => ({
      ...t,
      offsetX: Math.max(-1, Math.min(1, t.offsetX + (2 * dx) / DISPLAY_W)),
      offsetY: Math.max(-1, Math.min(1, t.offsetY + (2 * dy) / displayH)),
    }));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

  function save() {
    updateFrameFit(frame.id, { fit, transform, background });
    onClose();
  }
  function applyAll() {
    applyFitToAll({ fit, transform, background });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-[520px] w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">Cadrage de l'image</h3>

        <canvas
          ref={canvasRef}
          className="block mx-auto rounded-lg border border-gray-200 dark:border-gray-700 touch-none cursor-move bg-gray-100 dark:bg-gray-900"
          style={{ width: DISPLAY_W, height: displayH, maxWidth: '100%' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {isManual && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
            Glissez pour déplacer · molette pour zoomer
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {PRESETS.map((p) => (
            <button
              key={p.mode}
              onClick={() => selectPreset(p.mode)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                fit === p.mode || (p.mode === 'cover' && fit === 'custom')
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {fit === 'contain' && (
          <div className="flex items-center gap-3 mt-3 text-sm text-gray-600 dark:text-gray-300">
            <span>Fond :</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={background.type === 'color'}
                onChange={() => setBackground({ type: 'color', color: background.type === 'color' ? background.color : '#ffffff' })}
                className="accent-blue-600"
              />
              Couleur
            </label>
            {background.type === 'color' && (
              <input
                type="color"
                value={background.color}
                onChange={(e) => setBackground({ type: 'color', color: e.target.value })}
                className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 bg-transparent"
              />
            )}
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={background.type === 'blur'}
                onChange={() => setBackground({ type: 'blur' })}
                className="accent-blue-600"
              />
              Flou
            </label>
          </div>
        )}

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={applyAll}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Appliquer à toutes
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              Annuler
            </button>
            <button onClick={save} className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium">
              Valider
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
