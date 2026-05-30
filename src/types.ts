// src/types.ts
export interface FrameImage {
  id: string;
  file: File;
  url: string;
  name: string;
  duration?: number;
  textOverlays?: TextOverlay[];
  fit: FitMode;
  transform?: FrameTransform;
  background?: FrameBackground;
}

export type Quality = 'low' | 'medium' | 'high';
export type Transition = 'none' | 'crossfade' | 'slide';
export type DitherMethod = 'none' | 'FloydSteinberg' | 'ordered';

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
export type LoopMode = 'infinite' | '1' | '2' | '3' | 'custom';
export type EncoderId = 'fast' | 'quality';

export interface GifSettings {
  frameDuration: number;
  outputWidth: number;
  quality: Quality;
  loop: LoopMode;
  customLoopCount: number;
  transition: Transition;
  transitionDuration: number;
  outputHeight: number | 'auto';
  maxFileSize: number | 'unlimited';
  dithering: DitherMethod;
  colorCount: number;
  encodingSpeed: number;
  encoder: EncoderId;
}

export interface Preset {
  name: string;
  label: string;
  width: number;
  quality: Quality;
  maxFileSize: number;
  description: string;
}

export interface GifMetadata {
  size: number;
  width: number;
  height: number;
  frameCount: number;
  totalDuration: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  bold: boolean;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  previewEmoji: string;
  generate: (width: number, height: number) => Promise<File[]>;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface GifState {
  frames: FrameImage[];
  settings: GifSettings;
  isGenerating: boolean;
  progress: number;
  generatedGif: Blob | null;
  generatedMetadata: GifMetadata | null;
  theme: ThemeMode;

  addFrames: (files: File[]) => void;
  removeFrame: (id: string) => void;
  reorderFrames: (oldIndex: number, newIndex: number) => void;
  updateSettings: (partial: Partial<GifSettings>) => void;
  applyPreset: (preset: Preset) => void;
  setGenerating: (value: boolean) => void;
  setProgress: (value: number) => void;
  setGeneratedGif: (blob: Blob | null, metadata: GifMetadata | null) => void;
  updateFrameDuration: (frameId: string, duration: number | undefined) => void;
  updateFrameFit: (frameId: string, partial: Partial<FrameFit>) => void;
  applyFitToAll: (fitState: FrameFit) => void;
  addTextOverlay: (frameId: string, overlay: TextOverlay) => void;
  removeTextOverlay: (frameId: string, overlayId: string) => void;
  updateTextOverlay: (frameId: string, overlayId: string, partial: Partial<TextOverlay>) => void;
  setTheme: (theme: ThemeMode) => void;
  reset: () => void;
}
