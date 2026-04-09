// src/components/PresetBar.tsx
import { useGifStore } from '../stores/gifStore';
import { presets } from '../utils/presets';

export default function PresetBar() {
  const applyPreset = useGifStore((s) => s.applyPreset);
  const currentWidth = useGifStore((s) => s.settings.outputWidth);
  const currentQuality = useGifStore((s) => s.settings.quality);
  const currentMaxSize = useGifStore((s) => s.settings.maxFileSize);

  function isActive(p: typeof presets[0]) {
    return p.width === currentWidth && p.quality === currentQuality && p.maxFileSize === currentMaxSize;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Preset rapide</h3>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive(p)
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:text-blue-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:border-blue-400 dark:hover:text-blue-400'
            }`}
            title={p.description}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
