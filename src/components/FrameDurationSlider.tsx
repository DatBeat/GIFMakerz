import { useGifStore } from '../stores/gifStore';

interface Props {
  frameId: string;
  duration: number | undefined;
}

export default function FrameDurationSlider({ frameId, duration }: Props) {
  const globalDuration = useGifStore((s) => s.settings.frameDuration);
  const updateFrameDuration = useGifStore((s) => s.updateFrameDuration);

  const isCustom = duration !== undefined;
  const displayValue = duration ?? globalDuration;

  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5">
      <span className="text-[10px] text-gray-400 dark:text-gray-500">⏱</span>
      <input
        type="number"
        min={100}
        max={5000}
        step={100}
        value={displayValue}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val >= 100 && val <= 5000) {
            updateFrameDuration(frameId, val);
          }
        }}
        className={`w-14 text-[10px] font-mono px-1 py-0.5 rounded border text-center
          ${isCustom
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
            : 'bg-transparent border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'
          }
          focus:outline-none focus:ring-1 focus:ring-blue-500`}
        title={isCustom ? `${duration}ms (personnalisé)` : `${globalDuration}ms (global)`}
      />
      <span className="text-[9px] text-gray-400 dark:text-gray-500">ms</span>
      {isCustom && (
        <button
          onClick={() => updateFrameDuration(frameId, undefined)}
          className="text-[10px] text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
          title="Réinitialiser au global"
        >
          ×
        </button>
      )}
    </div>
  );
}
