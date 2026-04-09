import { create } from 'zustand';
import type { GifState, GifSettings, Preset, GifMetadata, ThemeMode, TextOverlay } from '../types';

const defaultSettings: GifSettings = {
  frameDuration: 500,
  outputWidth: 600,
  quality: 'medium',
  loop: 'infinite',
  customLoopCount: 1,
  transition: 'none',
  transitionDuration: 300,
  outputHeight: 'auto',
  maxFileSize: 500,
  dithering: 'FloydSteinberg',
  colorCount: 128,
  encodingSpeed: 5,
};

export const useGifStore = create<GifState>((set) => ({
  frames: [],
  settings: { ...defaultSettings },
  isGenerating: false,
  progress: 0,
  generatedGif: null,
  generatedMetadata: null,
  theme: (localStorage.getItem('gifmaker-theme') as ThemeMode) || 'system',

  addFrames: (files: File[]) =>
    set((state) => {
      const remaining = 20 - state.frames.length;
      if (remaining <= 0) return state;
      const newFrames = files.slice(0, remaining).map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        name: file.name,
      }));
      return { frames: [...state.frames, ...newFrames] };
    }),

  removeFrame: (id: string) =>
    set((state) => {
      const frame = state.frames.find((f) => f.id === id);
      if (frame) URL.revokeObjectURL(frame.url);
      return { frames: state.frames.filter((f) => f.id !== id) };
    }),

  reorderFrames: (oldIndex: number, newIndex: number) =>
    set((state) => {
      const frames = [...state.frames];
      const [moved] = frames.splice(oldIndex, 1);
      frames.splice(newIndex, 0, moved);
      return { frames };
    }),

  updateSettings: (partial: Partial<GifSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  applyPreset: (preset: Preset) =>
    set((state) => ({
      settings: {
        ...state.settings,
        outputWidth: preset.width,
        quality: preset.quality,
        maxFileSize: preset.maxFileSize,
      },
    })),

  updateFrameDuration: (frameId: string, duration: number | undefined) =>
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId ? { ...f, duration } : f
      ),
    })),

  addTextOverlay: (frameId: string, overlay: TextOverlay) =>
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? { ...f, textOverlays: [...(f.textOverlays || []), overlay] }
          : f
      ),
    })),

  removeTextOverlay: (frameId: string, overlayId: string) =>
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? { ...f, textOverlays: (f.textOverlays || []).filter((o) => o.id !== overlayId) }
          : f
      ),
    })),

  updateTextOverlay: (frameId: string, overlayId: string, partial: Partial<TextOverlay>) =>
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? {
              ...f,
              textOverlays: (f.textOverlays || []).map((o) =>
                o.id === overlayId ? { ...o, ...partial } : o
              ),
            }
          : f
      ),
    })),

  setTheme: (theme: ThemeMode) =>
    set(() => {
      localStorage.setItem('gifmaker-theme', theme);
      return { theme };
    }),

  setGenerating: (value: boolean) => set({ isGenerating: value }),
  setProgress: (value: number) => set({ progress: value }),
  setGeneratedGif: (blob: Blob | null, metadata: GifMetadata | null) =>
    set({ generatedGif: blob, generatedMetadata: metadata }),

  reset: () =>
    set((state) => {
      state.frames.forEach((f) => URL.revokeObjectURL(f.url));
      return {
        frames: [],
        settings: { ...defaultSettings },
        isGenerating: false,
        progress: 0,
        generatedGif: null,
        generatedMetadata: null,
      };
    }),
}));
