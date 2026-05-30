# Per-Frame Image Fit Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each frame choose how it sits in the output canvas (fill / contain / cover / tile / custom zoom+pan), replacing the current stretch, via a modal editor — with a shared `drawImageWithFit` renderer so preview == generated GIF.

**Architecture:** A pure `computeFitRect` geometry function feeds a `drawImageWithFit` canvas renderer used by all three render sites (encoder, transitions, preview). Per-frame fit state (`fit`/`transform`/`background`) lives on `FrameImage` in the zustand store and threads through the encode pipeline as a parallel `frameFits` array. A `FrameFitEditor` modal, opened from a per-frame button, edits that state with preset buttons + drag-pan + wheel-zoom.

**Tech Stack:** TypeScript, React 18, Zustand, Vite 8, Vitest 4 (jsdom), Canvas 2D.

---

## File Structure

**Created:**
- `src/utils/fit.ts` — `FitRect` + pure `computeFitRect()` geometry.
- `src/utils/__tests__/fit.test.ts` — geometry unit tests.
- `src/components/FrameFitEditor.tsx` — modal editor (presets, pan/zoom, background, apply-to-all).

**Modified:**
- `src/types.ts` — `FitMode`, `FrameTransform`, `FrameBackground`, `FrameFit`; `FrameImage` + `GifState` gain fit fields/actions.
- `src/stores/gifStore.ts` — default `fit:'cover'`, `updateFrameFit`, `applyFitToAll`.
- `src/__tests__/gifStore.test.ts` — assert new default + actions.
- `src/utils/imageUtils.ts` — `drawImageWithFit()` + `drawImageToFitCanvas()`.
- `src/utils/gifEncoder.ts` — `encodeGif`/`buildFrames` thread `frameFits`, render via `drawImageToFitCanvas`.
- `src/utils/transitions.ts` — `TransitionConfig.frameFits`, source canvases via `drawImageToFitCanvas`.
- `src/components/GenerateButton.tsx` — build `frameFits` from frames, pass to `encodeGif`.
- `src/components/Preview.tsx` — sequence build honours per-frame fit.
- `src/components/FrameItem.tsx` — "cadrer" button opens the editor; thumbnail reflects fit via CSS `object-fit`.

---

### Task 1: Types + store fit state

**Files:**
- Modify: `src/types.ts`
- Modify: `src/stores/gifStore.ts`
- Test: `src/__tests__/gifStore.test.ts`

- [ ] **Step 1: Write failing store tests**

In `src/__tests__/gifStore.test.ts`, add after the `'per-frame duration'` describe block:

```ts
  describe('per-frame fit', () => {
    it('new frames default to cover', () => {
      useGifStore.getState().addFrames([createMockFile('a.png')]);
      expect(useGifStore.getState().frames[0].fit).toBe('cover');
    });

    it('updates a single frame fit', () => {
      useGifStore.getState().addFrames([createMockFile('a.png'), createMockFile('b.png')]);
      const id = useGifStore.getState().frames[0].id;
      useGifStore.getState().updateFrameFit(id, { fit: 'contain', background: { type: 'blur' } });
      const f = useGifStore.getState().frames[0];
      expect(f.fit).toBe('contain');
      expect(f.background).toEqual({ type: 'blur' });
      expect(useGifStore.getState().frames[1].fit).toBe('cover');
    });

    it('applies a fit to all frames', () => {
      useGifStore.getState().addFrames([createMockFile('a.png'), createMockFile('b.png')]);
      useGifStore.getState().applyFitToAll({ fit: 'fill' });
      expect(useGifStore.getState().frames.every((f) => f.fit === 'fill')).toBe(true);
    });
  });
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- gifStore`
Expected: FAIL — `fit` undefined / `updateFrameFit` not a function / TS errors.

- [ ] **Step 3: Add types**

In `src/types.ts`, add after `export type DitherMethod = ...`:

```ts
export type FitMode = 'fill' | 'contain' | 'cover' | 'tile' | 'custom';

export interface FrameTransform {
  scale: number;   // multiplier on the base "cover" scale (>= 1 = zoom in), default 1
  offsetX: number; // normalized pan [-1..1], 0 = centered
  offsetY: number; // normalized pan [-1..1], 0 = centered
}

export type FrameBackground =
  | { type: 'color'; color: string }
  | { type: 'blur' };

export interface FrameFit {
  fit: FitMode;
  transform?: FrameTransform;
  background?: FrameBackground;
}
```

In `interface FrameImage`, add fields after `textOverlays?: TextOverlay[];`:

```ts
  fit: FitMode;
  transform?: FrameTransform;
  background?: FrameBackground;
```

In `interface GifState`, add after `updateFrameDuration: ...;`:

```ts
  updateFrameFit: (frameId: string, partial: Partial<FrameFit>) => void;
  applyFitToAll: (fitState: FrameFit) => void;
```

Make sure `FrameFit` is imported where needed — it's declared in this same file, so `GifState` can reference it directly.

- [ ] **Step 4: Implement store changes**

In `src/stores/gifStore.ts`, update the import line to include the new types:

```ts
import type { GifState, GifSettings, Preset, GifMetadata, ThemeMode, TextOverlay, FrameFit } from '../types';
```

In `addFrames`, set the default fit on each new frame — change the mapped object to:

```ts
      const newFrames = files.slice(0, remaining).map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        fit: 'cover' as const,
      }));
```

Add these two actions after `updateFrameDuration`:

```ts
  updateFrameFit: (frameId: string, partial: Partial<FrameFit>) =>
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId ? { ...f, ...partial } : f
      ),
    })),

  applyFitToAll: (fitState: FrameFit) =>
    set((state) => ({
      frames: state.frames.map((f) => ({ ...f, ...fitState })),
    })),
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- gifStore`
Expected: PASS.

- [ ] **Step 6: Commit**

```
git add src/types.ts src/stores/gifStore.ts src/__tests__/gifStore.test.ts
git commit -m "feat: per-frame fit state (default cover) + updateFrameFit/applyFitToAll"
```

---

### Task 2: `computeFitRect` geometry

**Files:**
- Create: `src/utils/fit.ts`
- Test: `src/utils/__tests__/fit.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/utils/__tests__/fit.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeFitRect } from '../fit';

// source 400x500 (portrait, ratio 0.8) into output 600x400 (landscape, ratio 1.5)
describe('computeFitRect', () => {
  it('fill stretches to the full output', () => {
    expect(computeFitRect(400, 500, 600, 400, 'fill')).toEqual({ dx: 0, dy: 0, dWidth: 600, dHeight: 400 });
  });

  it('contain fits the whole image with side bands', () => {
    expect(computeFitRect(400, 500, 600, 400, 'contain')).toEqual({ dx: 140, dy: 0, dWidth: 320, dHeight: 400 });
  });

  it('cover fills the output and overflows vertically', () => {
    expect(computeFitRect(400, 500, 600, 400, 'cover')).toEqual({ dx: 0, dy: -175, dWidth: 600, dHeight: 750 });
  });

  it('custom scale doubles the cover size', () => {
    const r = computeFitRect(400, 500, 600, 400, 'custom', { scale: 2, offsetX: 0, offsetY: 0 });
    expect(r.dWidth).toBe(1200);
    expect(r.dHeight).toBe(1500);
    expect(r.dx).toBe(-300); // centered at scale 2
  });

  it('offsetX shifts within the overflow', () => {
    const centered = computeFitRect(400, 500, 600, 400, 'custom', { scale: 1, offsetX: 0, offsetY: 0 });
    const shifted = computeFitRect(400, 500, 600, 400, 'custom', { scale: 1, offsetX: 1, offsetY: 0 });
    expect(shifted.dx).toBeGreaterThan(centered.dx);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- fit`
Expected: FAIL — `computeFitRect` not found.

- [ ] **Step 3: Implement**

Create `src/utils/fit.ts`:

```ts
import type { FitMode, FrameTransform } from '../types';

export interface FitRect {
  dx: number;
  dy: number;
  dWidth: number;
  dHeight: number;
}

// Destination rect to draw the source into the output box.
// Handles fill | contain | cover | custom. (tile is handled by the renderer.)
export function computeFitRect(
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
  fit: FitMode,
  transform?: FrameTransform
): FitRect {
  if (fit === 'fill') {
    return { dx: 0, dy: 0, dWidth: outW, dHeight: outH };
  }

  const srcRatio = srcW / srcH;
  const outRatio = outW / outH;

  if (fit === 'contain') {
    let dWidth: number;
    let dHeight: number;
    if (srcRatio > outRatio) {
      dWidth = outW;
      dHeight = outW / srcRatio;
    } else {
      dHeight = outH;
      dWidth = outH * srcRatio;
    }
    return { dx: (outW - dWidth) / 2, dy: (outH - dHeight) / 2, dWidth, dHeight };
  }

  // cover / custom: base cover scale, then transform scale + normalized pan
  let baseW: number;
  let baseH: number;
  if (srcRatio > outRatio) {
    baseH = outH;
    baseW = outH * srcRatio;
  } else {
    baseW = outW;
    baseH = outW / srcRatio;
  }
  const scale = transform?.scale ?? 1;
  const dWidth = baseW * scale;
  const dHeight = baseH * scale;
  const overflowX = (dWidth - outW) / 2;
  const overflowY = (dHeight - outH) / 2;
  const offX = transform?.offsetX ?? 0;
  const offY = transform?.offsetY ?? 0;
  const dx = (outW - dWidth) / 2 + overflowX * offX;
  const dy = (outH - dHeight) / 2 + overflowY * offY;
  return { dx, dy, dWidth, dHeight };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- fit`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```
git add src/utils/fit.ts src/utils/__tests__/fit.test.ts
git commit -m "feat: add computeFitRect geometry for image fit modes"
```

---

### Task 3: `drawImageWithFit` renderer

**Files:**
- Modify: `src/utils/imageUtils.ts`

> Canvas rendering can't be unit-tested in jsdom (no 2D context), so this task is verified by type-check + later manual browser validation. The geometry it relies on is already tested via `computeFitRect`.

- [ ] **Step 1: Implement the renderer**

In `src/utils/imageUtils.ts`, add these imports at the top:

```ts
import type { FitMode, FrameTransform, FrameBackground } from '../types';
import { computeFitRect } from './fit';
```

Append to the file:

```ts
export interface FitDrawOptions {
  fit: FitMode;
  transform?: FrameTransform;
  background?: FrameBackground;
  width: number;
  height: number;
}

// Draw an image into the output box honoring its fit mode.
export function drawImageWithFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  opts: FitDrawOptions
): void {
  const { fit, transform, background, width, height } = opts;
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  ctx.clearRect(0, 0, width, height);

  if (fit === 'tile') {
    // Mosaic: scale the source so several copies fit, then repeat-fill.
    const tileH = Math.max(1, Math.round(height / 2));
    const tileW = Math.max(1, Math.round((srcW / srcH) * tileH));
    const tile = document.createElement('canvas');
    tile.width = tileW;
    tile.height = tileH;
    tile.getContext('2d')!.drawImage(img, 0, 0, tileW, tileH);
    const pattern = ctx.createPattern(tile, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width, height);
    }
    return;
  }

  if (fit === 'contain') {
    if (background?.type === 'blur') {
      ctx.save();
      ctx.filter = 'blur(20px)';
      const cover = computeFitRect(srcW, srcH, width, height, 'cover');
      // oversize slightly so the blur doesn't leave transparent edges
      ctx.drawImage(img, cover.dx - 20, cover.dy - 20, cover.dWidth + 40, cover.dHeight + 40);
      ctx.restore();
    } else {
      ctx.fillStyle = background?.color ?? '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
  }

  const rect = computeFitRect(srcW, srcH, width, height, fit, transform);
  ctx.drawImage(img, rect.dx, rect.dy, rect.dWidth, rect.dHeight);
}

// Convenience: build a fit-rendered canvas at the output size.
export function drawImageToFitCanvas(
  img: HTMLImageElement,
  opts: FitDrawOptions
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext('2d')!;
  drawImageWithFit(ctx, img, opts);
  return canvas;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Run tests (no regressions)**

Run: `npm test`
Expected: all pass (no new tests here).

- [ ] **Step 4: Commit**

```
git add src/utils/imageUtils.ts
git commit -m "feat: add drawImageWithFit renderer (fill/contain/cover/tile/custom + bg)"
```

---

### Task 4: Thread `frameFits` through the encode pipeline

**Files:**
- Modify: `src/utils/transitions.ts`
- Modify: `src/utils/gifEncoder.ts`
- Modify: `src/components/GenerateButton.tsx`

- [ ] **Step 1: Add `frameFits` to transitions**

In `src/utils/transitions.ts`, update the imports:

```ts
import type { TextOverlay, FrameFit } from '../types';
import { loadImage, drawImageToFitCanvas } from './imageUtils';
import { drawAllTextOverlays } from './textRenderer';
```

(Remove `drawImageToCanvas` from that import if present.)

Add a field to `TransitionConfig` (after `frameTextOverlays?`):

```ts
  frameFits?: (FrameFit | undefined)[];
```

In `buildFramesWithTransitions`, replace the source-canvas build loop body so each source canvas is fit-rendered:

```ts
  const canvases: HTMLCanvasElement[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const img = await loadImage(imageUrls[i]);
    const f = config.frameFits?.[i];
    const canvas = drawImageToFitCanvas(img, {
      fit: f?.fit ?? 'cover',
      transform: f?.transform,
      background: f?.background,
      width,
      height,
    });
    if (config.frameTextOverlays?.[i]) {
      const ctx = canvas.getContext('2d')!;
      drawAllTextOverlays(ctx, config.frameTextOverlays[i], width, height);
    }
    canvases.push(canvas);
  }
```

- [ ] **Step 2: Thread through `gifEncoder`**

In `src/utils/gifEncoder.ts`, update imports:

```ts
import type { GifSettings, GifMetadata, TextOverlay, FrameFit } from '../types';
import { loadImage, computeHeight, drawImageToFitCanvas } from './imageUtils';
```

(Remove `drawImageToCanvas` from that import.)

Change `buildFrames`'s signature and the non-transition path to use fits:

```ts
async function buildFrames(
  imageUrls: string[],
  settings: GifSettings,
  height: number,
  frameDurations?: (number | undefined)[],
  frameTextOverlays?: (TextOverlay[] | undefined)[],
  frameFits?: (FrameFit | undefined)[]
): Promise<{ canvas: HTMLCanvasElement; delay: number }[]> {
  if (settings.transition !== 'none') {
    return buildFramesWithTransitions(imageUrls, {
      type: settings.transition,
      duration: settings.transitionDuration,
      frameDuration: settings.frameDuration,
      width: settings.outputWidth,
      height,
      frameDurations,
      frameTextOverlays,
      frameFits,
    });
  }

  const canvases: { canvas: HTMLCanvasElement; delay: number }[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const img = await loadImage(imageUrls[i]);
    const f = frameFits?.[i];
    const canvas = drawImageToFitCanvas(img, {
      fit: f?.fit ?? 'cover',
      transform: f?.transform,
      background: f?.background,
      width: settings.outputWidth,
      height,
    });
    if (frameTextOverlays?.[i]) {
      const ctx = canvas.getContext('2d')!;
      drawAllTextOverlays(ctx, frameTextOverlays[i]!, settings.outputWidth, height);
    }
    canvases.push({ canvas, delay: frameDurations?.[i] ?? settings.frameDuration });
  }
  return canvases;
}
```

Change `encodeGif`'s signature to accept and forward `frameFits`:

```ts
export async function encodeGif(
  imageUrls: string[],
  settings: GifSettings,
  onProgress: (progress: number) => void,
  frameDurations?: (number | undefined)[],
  frameTextOverlays?: (TextOverlay[] | undefined)[],
  frameFits?: (FrameFit | undefined)[]
): Promise<EncodeResult> {
```

And inside it, pass `frameFits` to `buildFrames`:

```ts
  const canvasFrames = await buildFrames(
    imageUrls,
    settings,
    height,
    frameDurations,
    frameTextOverlays,
    frameFits
  );
```

(The rest of `encodeGif` — height calc, FrameData mapping, encoder call, metadata — is unchanged.)

- [ ] **Step 3: Build `frameFits` in `GenerateButton`**

In `src/components/GenerateButton.tsx`, inside `handleGenerate`, after the `frameTextOverlays` line, add:

```ts
      const frameFits = frames.map((f) => ({ fit: f.fit, transform: f.transform, background: f.background }));
```

And update the `encodeGif` call to pass it:

```ts
      const result = await encodeGif(urls, settings, (p) => setProgress(p), frameDurations, frameTextOverlays, frameFits);
```

- [ ] **Step 4: Type-check + tests**

Run: `npx tsc -b && npm test`
Expected: no TS errors; all tests pass.

- [ ] **Step 5: Commit**

```
git add src/utils/transitions.ts src/utils/gifEncoder.ts src/components/GenerateButton.tsx
git commit -m "feat: thread per-frame fit through the encode pipeline"
```

---

### Task 5: Honor fit in the live preview

**Files:**
- Modify: `src/components/Preview.tsx`

- [ ] **Step 1: Update imports**

In `src/components/Preview.tsx`, change the imageUtils import to add `drawImageToFitCanvas`:

```ts
import { loadImage, computeHeight, drawImageToFitCanvas } from '../utils/imageUtils';
```

(Keep `drawImageToCanvas` removed — it should no longer be imported here.)

- [ ] **Step 2: Use fit in the sequence build**

In the sequence-building effect, the transition branch must pass fits and the no-transition branch must fit-render. Replace the whole `if (settings.transition !== 'none' && frames.length > 1) { ... } else { ... }` block with:

```ts
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
          frameFits: frames.map((f) => ({ fit: f.fit, transform: f.transform, background: f.background })),
        });
      } else {
        result = [];
        for (let i = 0; i < urls.length; i++) {
          const img = await loadImage(urls[i]);
          const canvas = drawImageToFitCanvas(img, {
            fit: frames[i].fit,
            transform: frames[i].transform,
            background: frames[i].background,
            width: settings.outputWidth,
            height: canvasHeight,
          });
          if (overlays[i]) {
            const ctx = canvas.getContext('2d')!;
            drawAllTextOverlays(ctx, overlays[i], settings.outputWidth, canvasHeight);
          }
          result.push({ canvas, delay: durations[i] ?? settings.frameDuration });
        }
      }
```

- [ ] **Step 3: Type-check + tests**

Run: `npx tsc -b && npm test`
Expected: no TS errors; all pass.

- [ ] **Step 4: Commit**

```
git add src/components/Preview.tsx
git commit -m "feat: preview honors per-frame fit (matches generated output)"
```

---

### Task 6: `FrameFitEditor` modal component

**Files:**
- Create: `src/components/FrameFitEditor.tsx`

> No automated test (canvas + interaction in jsdom is impractical); validated manually in Task 8.

- [ ] **Step 1: Implement the editor**

Create `src/components/FrameFitEditor.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { useGifStore } from '../stores/gifStore';
import { loadImage, drawImageWithFit } from '../utils/imageUtils';
import { computeHeight } from '../utils/imageUtils';
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

  // Display canvas keeps the output aspect ratio.
  const displayH = Math.round((outH / settings.outputWidth) * DISPLAY_W);

  useEffect(() => {
    loadImage(frame.url).then((img) => {
      imgRef.current = img;
      setOutH(computeHeight(img, settings.outputWidth, settings.outputHeight));
    });
  }, [frame.url, settings.outputWidth, settings.outputHeight]);

  // Re-render the editor canvas whenever the fit state changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = DISPLAY_W;
    canvas.height = displayH;
    const ctx = canvas.getContext('2d')!;
    drawImageWithFit(ctx, img, { fit, transform, background, width: DISPLAY_W, height: displayH });
  }, [fit, transform, background, displayH]);

  const isManual = fit === 'cover' || fit === 'custom';

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
  function onWheel(e: React.WheelEvent) {
    if (!isManual) return;
    setFit('custom');
    setTransform((t) => ({
      ...t,
      scale: Math.max(1, Math.min(5, t.scale - e.deltaY * 0.001)),
    }));
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
          onWheel={onWheel}
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```
git add src/components/FrameFitEditor.tsx
git commit -m "feat: add FrameFitEditor modal (presets + pan/zoom + bg + apply-to-all)"
```

---

### Task 7: Open the editor from `FrameItem` + thumbnail reflects fit

**Files:**
- Modify: `src/components/FrameItem.tsx`

- [ ] **Step 1: Wire the editor + fit-aware thumbnail**

In `src/components/FrameItem.tsx`, add imports at the top:

```ts
import { useState } from 'react';
import FrameFitEditor from './FrameFitEditor';
```

Map the fit mode to a CSS `object-fit` for the thumbnail. Add this inside the component, before `return`:

```ts
  const [editing, setEditing] = useState(false);
  const objectFit =
    frame.fit === 'contain' ? 'contain' : frame.fit === 'fill' ? 'fill' : 'cover';
```

Change the `<img>` `className` from `w-full h-20 object-cover` to use the mapped fit via inline style (Tailwind has no dynamic object-fit class):

```tsx
        <img
          src={frame.url}
          alt={frame.name}
          className="w-full h-20"
          style={{ objectFit }}
        />
```

Add a "cadrer" button next to the remove button (so it doesn't conflict with the drag listeners — it's outside the `{...listeners}` wrapper, as a sibling of the remove button):

```tsx
      <button
        onClick={() => setEditing(true)}
        className="absolute bottom-7 right-1 bg-black/60 text-white rounded px-1.5 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        title="Cadrer l'image"
      >
        ✎ cadrer
      </button>
```

Render the editor modal when open — add right before the final closing `</div>` of the component:

```tsx
      {editing && <FrameFitEditor frame={frame} onClose={() => setEditing(false)} />}
```

- [ ] **Step 2: Type-check + tests**

Run: `npx tsc -b && npm test`
Expected: no TS errors; all pass.

- [ ] **Step 3: Commit**

```
git add src/components/FrameItem.tsx
git commit -m "feat: open fit editor from frame thumbnail; thumbnail reflects fit"
```

---

### Task 8: Build verification + manual browser validation

**Files:** none (verification only)

- [ ] **Step 1: Clean check**

Run: `npx tsc -b && npm test && npm run build`
Expected: no TS errors; all tests green; `dist/` produced.

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`. Open the printed URL.

- [ ] **Step 3: Manual — fit modes**

Add a portrait image (ratio ≠ output) + a second image, set Hauteur de sortie = Personnalisé so the box is landscape. Click "✎ cadrer" on the portrait. Verify:
- **Couvrir** fills the box, no distortion, edges cropped.
- **Contenir** shows the whole image with bands; toggle **Couleur** (pick a color) and **Flou** — bands update.
- **Remplir** stretches (distorted) edge-to-edge.
- **Mosaïque** tiles the image.
- Drag on the canvas pans; mouse wheel zooms (mode switches to manual). Valider persists.

- [ ] **Step 4: Manual — propagation**

Confirm the main Preview shows the same framing as the editor, and that **Appliquer à toutes** copies the framing to every frame. Generate the GIF and confirm the output matches the preview framing (download + view).

- [ ] **Step 5: Manual — thumbnail**

Confirm each frame thumbnail roughly reflects its mode (cover/contain/fill).

---

## Self-Review

**Spec coverage:**
- Data model (FitMode/FrameTransform/FrameBackground/FrameFit + FrameImage fields) → Task 1. ✅
- Default cover → Task 1. ✅
- `computeFitRect` pure geometry → Task 2. ✅
- `drawImageWithFit` + tile + blur/color bg → Task 3. ✅
- Shared renderer across encoder/transitions/preview → Tasks 4 & 5. ✅
- `frameFits` propagation incl. GenerateButton → Task 4. ✅
- Modal editor: presets + pan/zoom (custom) + contain bg color/blur + apply-to-all + save/cancel → Task 6. ✅
- Entry from FrameItem + thumbnail object-fit → Task 7. ✅
- Tests (computeFitRect, store) + manual → Tasks 1, 2, 8. ✅
- Out of scope (rotation, filters, parametric tile, videoExtractor) → not touched. ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code. ✅

**Type consistency:** `FrameFit` ({fit, transform?, background?}) defined in Task 1 and consumed identically in Tasks 4/5/6; `FitDrawOptions` (Task 3) consumed by Tasks 4/5/6; `computeFitRect` signature (Task 2) used by Task 3; store actions `updateFrameFit`/`applyFitToAll` defined in Task 1 and called in Tasks 6/7. ✅

**Known minor note:** `drawImageToCanvas` (legacy stretch) becomes unused after Tasks 4–5. Leaving it is harmless; it can be removed in a follow-up cleanup. The plan does not remove it to keep each task’s diff minimal.
