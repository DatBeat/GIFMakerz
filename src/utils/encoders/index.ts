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
  repeat: number; // Netscape loop count: 0 = loop forever, -1 = no loop ext (plays once), n>0 = n extra iterations (plays n+1 times)
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
