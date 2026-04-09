// src/types.ts
export interface FrameImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

export type Quality = 'low' | 'medium' | 'high';
export type Transition = 'none' | 'crossfade' | 'slide';
export type DitherMethod = 'none' | 'FloydSteinberg' | 'ordered';
export type LoopMode = 'infinite' | '1' | '2' | '3' | 'custom';

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
  setTheme: (theme: ThemeMode) => void;
  reset: () => void;
}
