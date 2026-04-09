// src/components/SettingsPanel.tsx
import { useGifStore } from '../stores/gifStore';
import type { Quality, LoopMode } from '../types';

export default function SettingsPanel() {
  const settings = useGifStore((s) => s.settings);
  const updateSettings = useGifStore((s) => s.updateSettings);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Paramètres</h3>

      {/* Durée par frame */}
      <div>
        <label className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
          <span>Durée par frame</span>
          <span className="font-mono text-gray-900 dark:text-gray-100">{settings.frameDuration}ms</span>
        </label>
        <input
          type="range"
          min={100}
          max={5000}
          step={100}
          value={settings.frameDuration}
          onChange={(e) => updateSettings({ frameDuration: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>100ms</span>
          <span>5000ms</span>
        </div>
      </div>

      {/* Largeur de sortie */}
      <div>
        <label className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
          <span>Largeur de sortie</span>
          <span className="font-mono text-gray-900 dark:text-gray-100">{settings.outputWidth}px</span>
        </label>
        <input
          type="range"
          min={200}
          max={800}
          step={10}
          value={settings.outputWidth}
          onChange={(e) => updateSettings({ outputWidth: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>200px</span>
          <span>800px</span>
        </div>
      </div>

      {/* Qualité */}
      <div>
        <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Qualité</label>
        <div className="flex gap-3">
          {(['low', 'medium', 'high'] as Quality[]).map((q) => (
            <label key={q} className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="quality"
                checked={settings.quality === q}
                onChange={() => updateSettings({ quality: q })}
                className="accent-blue-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-200">
                {q === 'low' ? 'Basse' : q === 'medium' ? 'Moyenne' : 'Haute'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Boucle */}
      <div>
        <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Boucle</label>
        <select
          value={settings.loop}
          onChange={(e) => updateSettings({ loop: e.target.value as LoopMode })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="infinite">Infinie</option>
          <option value="1">1×</option>
          <option value="2">2×</option>
          <option value="3">3×</option>
          <option value="custom">Personnalisé</option>
        </select>
        {settings.loop === 'custom' && (
          <input
            type="number"
            min={1}
            max={100}
            value={settings.customLoopCount}
            onChange={(e) => updateSettings({ customLoopCount: Number(e.target.value) })}
            className="mt-2 w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nombre"
          />
        )}
      </div>
    </div>
  );
}
