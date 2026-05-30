// src/components/AdvancedSettings.tsx
import { useState } from 'react';
import { useGifStore } from '../stores/gifStore';
import type { Transition, EncoderId } from '../types';

export default function AdvancedSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const settings = useGifStore((s) => s.settings);
  const updateSettings = useGifStore((s) => s.updateSettings);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span>Paramètres avancés</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
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
          {/* Transition */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Transition</label>
            <select
              value={settings.transition}
              onChange={(e) => updateSettings({ transition: e.target.value as Transition })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">Aucune</option>
              <option value="crossfade">Fondu (crossfade)</option>
              <option value="slide">Slide</option>
            </select>
          </div>

          {/* Durée de transition - only shown if transition is not "none" */}
          {settings.transition !== 'none' && (
            <div>
              <label className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>Durée de transition</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">{settings.transitionDuration}ms</span>
              </label>
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={settings.transitionDuration}
                onChange={(e) => updateSettings({ transitionDuration: Number(e.target.value) })}
                className="w-full accent-blue-600"
              />
            </div>
          )}

          {/* Hauteur de sortie */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Hauteur de sortie</label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={settings.outputHeight === 'auto'}
                  onChange={() => updateSettings({ outputHeight: 'auto' })}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">Auto (conserve ratio)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  checked={settings.outputHeight !== 'auto'}
                  onChange={() => updateSettings({ outputHeight: 400 })}
                  className="accent-blue-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-200">Personnalisé</span>
              </label>
            </div>
            {settings.outputHeight !== 'auto' && (
              <input
                type="number"
                min={100}
                max={800}
                value={settings.outputHeight}
                onChange={(e) => updateSettings({ outputHeight: Number(e.target.value) })}
                className="mt-2 w-24 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Poids max cible */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Poids max cible</label>
            <select
              value={settings.maxFileSize === 'unlimited' ? 'unlimited' : settings.maxFileSize}
              onChange={(e) =>
                updateSettings({
                  maxFileSize: e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value),
                })
              }
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={250}>250 KB</option>
              <option value={500}>500 KB</option>
              <option value={1000}>1 MB</option>
              <option value="unlimited">Illimité</option>
            </select>
          </div>

          {/* Nombre de couleurs */}
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Nombre de couleurs</label>
            <select
              value={settings.colorCount}
              onChange={(e) => updateSettings({ colorCount: Number(e.target.value) })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={16}>16</option>
              <option value={32}>32</option>
              <option value={64}>64</option>
              <option value={128}>128</option>
              <option value={256}>256</option>
            </select>
          </div>

        </div>
      )}
    </div>
  );
}
