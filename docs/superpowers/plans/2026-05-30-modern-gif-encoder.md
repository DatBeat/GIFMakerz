# Modern GIF Encoder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unmaintained `gif.js` encoder with two modern encoders — `gifenc` (Fast, preview) and `gifski-wasm` (Quality, email deliverable) — behind a pluggable registry, with a manual toggle defaulting to Fast.

**Architecture:** `encodeGif()` keeps its public signature and `EncodeResult` shape. It splits into (1) `buildFrames()` — existing transition/overlay/canvas logic, unchanged — and (2) a selected `Encoder` from a registry keyed by `settings.encoder`. Encoders consume plain RGBA `FrameData` (decoupled from the DOM) so the Fast encoder is unit-testable in jsdom. gif.js is removed entirely.

**Tech Stack:** TypeScript, React 18, Zustand, Vite 8, Vitest 4 (jsdom), `gifenc`, `gifski-wasm`.

---

## File Structure

**Created:**
- `src/utils/encoders/index.ts` — `Encoder` / `FrameData` / `EncodeOpts` types + `encoders` registry.
- `src/utils/encoders/gifenc.ts` — Fast encoder (`fastEncoder`).
- `src/utils/encoders/gifski.ts` — Quality encoder (`qualityEncoder`).
- `src/utils/encoders/__tests__/encoders.test.ts` — registry + gifenc unit tests.

**Modified:**
- `src/types.ts` — add `EncoderId` type + `GifSettings.encoder`.
- `src/stores/gifStore.ts` — add `encoder: 'fast'` to `defaultSettings`.
- `src/utils/gifEncoder.ts` — extract `buildFrames()`, delegate to registry, drop gif.js import + `getGifQuality`/`getDither`.
- `src/components/AdvancedSettings.tsx` — add encoder toggle; remove inert Dithering + Vitesse d'encodage controls.
- `src/__tests__/gifStore.test.ts` — assert new `encoder` default.
- `package.json` / `package-lock.json` — remove `gif.js`, add `gifenc` + `gifski-wasm`.

**Deleted:**
- `public/gif.worker.js`
- `src/gif.js.d.ts`

---

### Task 1: Install dependencies, add `encoder` type + store default

**Files:**
- Modify: `package.json` (dependencies)
- Modify: `src/types.ts:11-29`
- Modify: `src/stores/gifStore.ts:4-17`
- Test: `src/__tests__/gifStore.test.ts:62-72`

- [ ] **Step 1: Install/uninstall packages**

Run:
```
npm install gifenc gifski-wasm
npm uninstall gif.js
```
Expected: `package.json` now lists `gifenc` and `gifski-wasm` under dependencies and no longer lists `gif.js`.

- [ ] **Step 2: Add the failing store-default assertion**

In `src/__tests__/gifStore.test.ts`, inside the `it('has correct defaults', ...)` block (after the `encodingSpeed` assertion at line 71), add:

```ts
      expect(s.encoder).toBe('fast');
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- gifStore`
Expected: FAIL — `s.encoder` is `undefined`, and/or TypeScript error `Property 'encoder' does not exist on type 'GifSettings'`.

- [ ] **Step 4: Add the `encoder` field to the type**

In `src/types.ts`, after the existing type aliases (after line 14, `export type LoopMode = ...`), add:

```ts
export type EncoderId = 'fast' | 'quality';
```

Then inside `interface GifSettings` (before the closing `}` at line 29), add:

```ts
  encoder: EncoderId;
```

- [ ] **Step 5: Add the default to the store**

In `src/stores/gifStore.ts`, inside `defaultSettings` (after `encodingSpeed: 5,` at line 16), add:

```ts
  encoder: 'fast',
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- gifStore`
Expected: PASS.

- [ ] **Step 7: Commit**

```
git add package.json package-lock.json src/types.ts src/stores/gifStore.ts src/__tests__/gifStore.test.ts
git commit -m "feat: add encoder setting (default fast), install gifenc + gifski-wasm, drop gif.js dep"
```

---

### Task 2: Encoder interface + registry

**Files:**
- Create: `src/utils/encoders/index.ts`
- Create: `src/utils/encoders/__tests__/encoders.test.ts`

> The registry imports `gifenc.ts` and `gifski.ts`, written in Tasks 3–4. Create thin placeholder modules first so the registry compiles, then flesh them out. Tests in this task mock `gifski-wasm` so no WASM loads in jsdom.

- [ ] **Step 1: Create placeholder encoder modules**

Create `src/utils/encoders/gifenc.ts`:

```ts
import type { Encoder } from './index';

export const fastEncoder: Encoder = {
  id: 'fast',
  async encode() {
    throw new Error('not implemented');
  },
};
```

Create `src/utils/encoders/gifski.ts`:

```ts
import type { Encoder } from './index';

export const qualityEncoder: Encoder = {
  id: 'quality',
  async encode() {
    throw new Error('not implemented');
  },
};
```

- [ ] **Step 2: Write the registry**

Create `src/utils/encoders/index.ts`:

```ts
import type { EncoderId, Quality } from '../../types';
import { fastEncoder } from './gifenc';
import { qualityEncoder } from './gifski';

// One animation frame as raw RGBA pixels, decoupled from the DOM.
export interface FrameData {
  data: Uint8ClampedArray; // RGBA, length = width * height * 4
  width: number;
  height: number;
  delay: number; // milliseconds
}

export interface EncodeOpts {
  width: number;
  height: number;
  repeat: number; // 0 = infinite, -1 = once, n>0 = loop count
  colorCount: number; // max palette colors (Fast only)
  quality: Quality;
}

export interface Encoder {
  id: EncoderId;
  encode(
    frames: FrameData[],
    opts: EncodeOpts,
    onProgress: (p: number) => void
  ): Promise<Blob>;
}

export const encoders: Record<EncoderId, Encoder> = {
  fast: fastEncoder,
  quality: qualityEncoder,
};
```

- [ ] **Step 3: Write the registry test**

Create `src/utils/encoders/__tests__/encoders.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

// Neutralize the WASM module so importing the registry never loads gifski wasm.
vi.mock('gifski-wasm', () => ({ default: vi.fn() }));

import { encoders } from '../index';

describe('encoder registry', () => {
  it('maps fast -> fastEncoder', () => {
    expect(encoders.fast.id).toBe('fast');
  });

  it('maps quality -> qualityEncoder', () => {
    expect(encoders.quality.id).toBe('quality');
  });
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- encoders`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```
git add src/utils/encoders
git commit -m "feat: add pluggable encoder registry with FrameData/EncodeOpts interfaces"
```

---

### Task 3: Fast encoder (gifenc)

**Files:**
- Modify: `src/utils/encoders/gifenc.ts`
- Test: `src/utils/encoders/__tests__/encoders.test.ts`

- [ ] **Step 1: Add the failing gifenc test**

Append to `src/utils/encoders/__tests__/encoders.test.ts`:

```ts
import { fastEncoder } from '../gifenc';
import type { FrameData, EncodeOpts } from '../index';

function makeFrame(w: number, h: number, delay: number): FrameData {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;     // R
    data[i + 1] = 0;   // G
    data[i + 2] = 0;   // B
    data[i + 3] = 255; // A
  }
  return { data, width: w, height: h, delay };
}

const opts: EncodeOpts = {
  width: 2,
  height: 2,
  repeat: 0,
  colorCount: 128,
  quality: 'medium',
};

describe('fastEncoder (gifenc)', () => {
  it('produces a valid animated GIF blob', async () => {
    const frames = [makeFrame(2, 2, 100), makeFrame(2, 2, 100)];
    const onProgress = vi.fn();
    const blob = await fastEncoder.encode(frames, opts, onProgress);

    expect(blob.type).toBe('image/gif');
    expect(blob.size).toBeGreaterThan(0);

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2])).toBe('GIF');

    expect(onProgress).toHaveBeenCalledWith(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- encoders`
Expected: FAIL — `not implemented` thrown by the placeholder.

- [ ] **Step 3: Implement the gifenc encoder**

Replace the entire contents of `src/utils/encoders/gifenc.ts`:

```ts
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import type { Encoder } from './index';

// Fast preview encoder. Per-frame local palettes for accuracy; gifenc has no
// dithering or speed knobs, so `dithering`/`encodingSpeed` settings are ignored.
export const fastEncoder: Encoder = {
  id: 'fast',
  async encode(frames, opts, onProgress) {
    const gif = GIFEncoder();

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      const palette = quantize(f.data, opts.colorCount);
      const index = applyPalette(f.data, palette);
      gif.writeFrame(index, f.width, f.height, {
        palette,
        delay: f.delay,
        // Loop block is written from the first frame only.
        repeat: i === 0 ? opts.repeat : undefined,
      });
      onProgress(((i + 1) / frames.length) * 0.95);
      // Yield to the event loop so the UI/progress bar can update.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    gif.finish();
    onProgress(1);
    return new Blob([gif.bytes()], { type: 'image/gif' });
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- encoders`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```
git add src/utils/encoders/gifenc.ts src/utils/encoders/__tests__/encoders.test.ts
git commit -m "feat: implement Fast encoder with gifenc"
```

---

### Task 4: Quality encoder (gifski-wasm)

**Files:**
- Modify: `src/utils/encoders/gifski.ts`

> gifski-wasm encoding needs WASM + workers and is impractical to run in jsdom, so there is no automated encode test here — it is validated manually in the browser (Task 8). The registry already proves `qualityEncoder` is wired and mockable.

- [ ] **Step 1: Implement the gifski encoder**

Replace the entire contents of `src/utils/encoders/gifski.ts`:

```ts
import encode from 'gifski-wasm';
import type { Encoder } from './index';
import type { Quality } from '../../types';

function gifskiQuality(q: Quality): number {
  switch (q) {
    case 'low':
      return 50;
    case 'medium':
      return 80;
    case 'high':
      return 100;
  }
}

// High-quality email deliverable encoder. gifski handles palette and dithering
// internally; `quality` (1-100) trades file size against fidelity.
export const qualityEncoder: Encoder = {
  id: 'quality',
  async encode(frames, opts, onProgress) {
    onProgress(0.1);

    const frameBuffers = frames.map(
      (f) => new Uint8Array(f.data.buffer, f.data.byteOffset, f.data.byteLength)
    );
    const frameDurations = frames.map((f) => f.delay);

    const output = await encode({
      frames: frameBuffers,
      width: opts.width,
      height: opts.height,
      frameDurations,
      quality: gifskiQuality(opts.quality),
      repeat: opts.repeat,
    });

    onProgress(1);
    return new Blob([output], { type: 'image/gif' });
  },
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -b`
Expected: no errors. (If `gifski-wasm` ships no types, see Task 8 Step 5 for a shim.)

- [ ] **Step 3: Run the existing tests to confirm nothing broke**

Run: `npm test -- encoders`
Expected: PASS (3 tests; the `gifski-wasm` mock keeps WASM out of jsdom).

- [ ] **Step 4: Commit**

```
git add src/utils/encoders/gifski.ts
git commit -m "feat: implement Quality encoder with gifski-wasm"
```

---

### Task 5: Refactor `gifEncoder.ts` to use the registry

**Files:**
- Modify: `src/utils/gifEncoder.ts` (full rewrite)

> This removes the last `gif.js` import. `buildFrames()` is the existing logic moved verbatim; only the encoding tail changes.

- [ ] **Step 1: Rewrite the orchestrator**

Replace the entire contents of `src/utils/gifEncoder.ts`:

```ts
// src/utils/gifEncoder.ts
import type { GifSettings, GifMetadata, TextOverlay } from '../types';
import { loadImage, drawImageToCanvas, computeHeight } from './imageUtils';
import { drawAllTextOverlays } from './textRenderer';
import { buildFramesWithTransitions } from './transitions';
import { encoders } from './encoders';
import type { FrameData } from './encoders';

function getRepeatValue(settings: GifSettings): number {
  switch (settings.loop) {
    case 'infinite': return 0;
    case '1': return 1;
    case '2': return 2;
    case '3': return 3;
    case 'custom': return settings.customLoopCount;
    default: return 0;
  }
}

export interface EncodeResult {
  blob: Blob;
  metadata: GifMetadata;
}

// Build the resized canvases (with transitions + text overlays) for each frame.
async function buildFrames(
  imageUrls: string[],
  settings: GifSettings,
  height: number,
  frameDurations?: (number | undefined)[],
  frameTextOverlays?: (TextOverlay[] | undefined)[]
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
    });
  }

  const canvases: { canvas: HTMLCanvasElement; delay: number }[] = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const img = await loadImage(imageUrls[i]);
    const canvas = drawImageToCanvas(img, settings.outputWidth, height);
    if (frameTextOverlays?.[i]) {
      const ctx = canvas.getContext('2d')!;
      drawAllTextOverlays(ctx, frameTextOverlays[i]!, settings.outputWidth, height);
    }
    canvases.push({ canvas, delay: frameDurations?.[i] ?? settings.frameDuration });
  }
  return canvases;
}

function canvasToFrameData(
  canvas: HTMLCanvasElement,
  delay: number
): FrameData {
  const ctx = canvas.getContext('2d')!;
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { data, width, height, delay };
}

export async function encodeGif(
  imageUrls: string[],
  settings: GifSettings,
  onProgress: (progress: number) => void,
  frameDurations?: (number | undefined)[],
  frameTextOverlays?: (TextOverlay[] | undefined)[]
): Promise<EncodeResult> {
  const firstImg = await loadImage(imageUrls[0]);
  const height = computeHeight(firstImg, settings.outputWidth, settings.outputHeight);

  const canvasFrames = await buildFrames(
    imageUrls,
    settings,
    height,
    frameDurations,
    frameTextOverlays
  );

  const frames: FrameData[] = canvasFrames.map((cf) =>
    canvasToFrameData(cf.canvas, cf.delay)
  );

  const encoder = encoders[settings.encoder];
  const blob = await encoder.encode(
    frames,
    {
      width: settings.outputWidth,
      height,
      repeat: getRepeatValue(settings),
      colorCount: settings.colorCount,
      quality: settings.quality,
    },
    onProgress
  );

  const totalDuration = frames.reduce((sum, f) => sum + f.delay, 0);
  return {
    blob,
    metadata: {
      size: blob.size,
      width: settings.outputWidth,
      height,
      frameCount: frames.length,
      totalDuration,
    },
  };
}
```

- [ ] **Step 2: Type-check and run the full suite**

Run: `npx tsc -b && npm test`
Expected: no TS errors; all tests pass (the 26 existing + new encoder tests). No test imports `gif.js`.

- [ ] **Step 3: Commit**

```
git add src/utils/gifEncoder.ts
git commit -m "refactor: route encodeGif through encoder registry, remove gif.js usage"
```

---

### Task 6: UI encoder toggle

**Files:**
- Modify: `src/components/AdvancedSettings.tsx`

- [ ] **Step 1: Import the type**

In `src/components/AdvancedSettings.tsx`, change the type import (line 4) from:

```ts
import type { Transition, DitherMethod } from '../types';
```
to:
```ts
import type { Transition, EncoderId } from '../types';
```

- [ ] **Step 2: Add the encoder toggle**

In `src/components/AdvancedSettings.tsx`, insert this block immediately after the opening `<div className="px-4 pb-4 space-y-4 ...">` (i.e. as the first control, before the `{/* Transition */}` block at line 23):

```tsx
          {/* Encodeur */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Encodeur</label>
            <select
              value={settings.encoder}
              onChange={(e) => updateSettings({ encoder: e.target.value as EncoderId })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fast">Rapide (preview)</option>
              <option value="quality">Qualité max (email)</option>
            </select>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Qualité max = GIF plus léger et plus net, encodage plus lent.
            </p>
          </div>
```

- [ ] **Step 3: Remove the inert Dithering control**

In `src/components/AdvancedSettings.tsx`, delete the entire `{/* Dithering */}` block (the `<div>` containing the `Dithering` label and its `<select>` with options none/FloydSteinberg/ordered — lines 110-122 in the original file). Neither encoder uses it.

- [ ] **Step 4: Remove the inert Vitesse d'encodage control**

Delete the entire `{/* Vitesse d'encodage */}` block (the `<div>` with the `encodingSpeed` range input and its Meilleure qualité / Plus rapide labels — lines 140-159 in the original file). gifenc has no speed knob.

- [ ] **Step 5: Type-check and build**

Run: `npx tsc -b`
Expected: no errors. In particular, `DitherMethod` is no longer imported and no longer referenced (its only uses were in the deleted Dithering block).

- [ ] **Step 6: Commit**

```
git add src/components/AdvancedSettings.tsx
git commit -m "feat: add encoder toggle, remove inert dithering + speed controls"
```

---

### Task 7: Remove gif.js artifacts

**Files:**
- Delete: `public/gif.worker.js`
- Delete: `src/gif.js.d.ts`

- [ ] **Step 1: Confirm nothing still references gif.js**

Run: `git grep -n "gif.js\|gif.worker\|from 'gif.js'\|GIF(" -- src public` (ignore matches inside docs/.claude)
Expected: no remaining import of `gif.js` or reference to `gif.worker.js` in `src/`. The only file constructing the old `GIF(...)` was `gifEncoder.ts`, already rewritten.

- [ ] **Step 2: Delete the files**

Run:
```
git rm public/gif.worker.js src/gif.js.d.ts
```

- [ ] **Step 3: Build and test**

Run: `npm run build && npm test`
Expected: production build succeeds with no reference to gif.js; all tests pass.

- [ ] **Step 4: Commit**

```
git add -A
git commit -m "chore: remove gif.js worker and type shim"
```

---

### Task 8: Build verification + manual encode validation

**Files:** none (verification only)

- [ ] **Step 1: Clean type-check, full test, production build**

Run: `npx tsc -b && npm test && npm run build`
Expected: no TS errors; all tests green; `dist/` produced.

- [ ] **Step 2: Run the dev server**

Run: `npm run dev`
Open the printed localhost URL.

- [ ] **Step 3: Manual — Fast encoder**

Add ≥2 images, keep encoder = "Rapide (preview)", click Générer le GIF.
Expected: progress bar advances 0→100%, a GIF renders in the preview/download panel, downloads and plays animated.

- [ ] **Step 4: Manual — Quality encoder + size comparison**

Switch encoder to "Qualité max (email)", regenerate the same frames.
Expected: a valid animated GIF; note its size vs the Fast output. On a 10-frame @600px reference set, confirm Quality is visually ≥ Fast and ideally smaller-or-comparable in bytes. Confirm per-frame durations are respected.

- [ ] **Step 5 (contingency): Vite WASM / types issues**

If `npm run build` or `npm run dev` fails to load gifski-wasm, add to `vite.config.ts`:
```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: { exclude: ['gifski-wasm'] },
});
```
If `npx tsc -b` reports `gifski-wasm` has no type declarations, create `src/gifski-wasm.d.ts`:
```ts
declare module 'gifski-wasm' {
  interface GifskiOptions {
    frames: Array<Uint8Array | ImageData>;
    width: number;
    height: number;
    fps?: number;
    frameDurations?: number[];
    quality?: number;
    repeat?: number;
    resizeWidth?: number;
    resizeHeight?: number;
  }
  export default function encode(options: GifskiOptions): Promise<Uint8Array>;
}
```
Commit any contingency fix:
```
git add vite.config.ts src/gifski-wasm.d.ts
git commit -m "chore: gifski-wasm vite + type integration"
```

- [ ] **Step 6: Final commit (if any verification fixes were made)**

Ensure the working tree is clean: `git status` shows nothing to commit beyond the above.

---

## Self-Review

**Spec coverage:**
- Pluggable architecture + `buildFrames()` split → Task 5. ✅
- Fast (gifenc) → Task 3. ✅
- Quality (gifski) → Task 4. ✅
- gif.js fully removed (dep + worker + d.ts) → Tasks 1 & 7. ✅
- `GifSettings.encoder`, default `fast` → Task 1. ✅
- UI toggle + removal of inert controls → Task 6. ✅
- Tests (registry, Fast encode, store default) + manual size/quality check → Tasks 2, 3, 8. ✅
- Out of scope (auto maxFileSize re-encode, FFmpeg, legacy) → not implemented. ✅

**Placeholder scan:** Placeholder encoder modules in Task 2 are intentional and fully replaced in Tasks 3–4; no `TBD`/`TODO` remain. Each code step shows complete code. ✅

**Type consistency:** `EncoderId` ('fast'|'quality') defined in Task 1, used by `GifSettings.encoder`, the registry `Record<EncoderId, Encoder>`, `Encoder.id`, and the UI cast. `FrameData`/`EncodeOpts` defined in Task 2, consumed identically in Tasks 3–5. `fastEncoder`/`qualityEncoder` names consistent across registry and modules. `encode` (gifski default export) signature matches the Task 8 type shim. ✅

**Known minor debt:** `dithering` and `encodingSpeed` remain in `GifSettings`/store as inert fields (controls removed). Documented in spec; safe to prune later.
