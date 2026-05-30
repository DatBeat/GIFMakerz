declare module 'gifenc' {
  export type Palette = number[][]; // array of [r, g, b] or [r, g, b, a]
  export type PixelFormat = 'rgb565' | 'rgb444' | 'rgba4444';

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: PixelFormat; oneBitAlpha?: boolean | number; clearAlpha?: boolean; clearAlphaColor?: number; clearAlphaThreshold?: number }
  ): Palette;

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: PixelFormat
  ): Uint8Array;

  export interface WriteFrameOptions {
    palette?: Palette;
    first?: boolean;
    transparent?: boolean;
    transparentIndex?: number;
    delay?: number;
    repeat?: number;
    dispose?: number;
  }

  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, options?: WriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
    bytesView(): Uint8Array; // live view into the encoder's buffer — may be mutated/reallocated; copy before passing to Blob. Prefer bytes().
    reset(): void;
  }

  export function GIFEncoder(options?: { auto?: boolean; initialCapacity?: number }): GIFEncoderInstance;
}
