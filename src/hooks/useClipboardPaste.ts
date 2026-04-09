import { useEffect } from 'react';
import { useGifStore } from '../stores/gifStore';

export function useClipboardPaste() {
  const addFrames = useGifStore((s) => s.addFrames);

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const files: File[] = [];
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }

      if (files.length > 0) {
        e.preventDefault();
        addFrames(files);
      }
    }

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [addFrames]);
}
