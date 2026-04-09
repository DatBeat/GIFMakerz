import { useState } from 'react';
import { useGifStore } from '../stores/gifStore';
import { templates } from '../utils/templates';

export default function TemplateGallery() {
  const addFrames = useGifStore((s) => s.addFrames);
  const settings = useGifStore((s) => s.settings);
  const [generating, setGenerating] = useState<string | null>(null);

  async function handleUseTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setGenerating(templateId);
    try {
      const height = Math.round(settings.outputWidth * 0.6); // 5:3 ratio
      const files = await template.generate(settings.outputWidth, height);
      addFrames(files);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
        <span>🎨</span> Templates
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => handleUseTemplate(t.id)}
            disabled={generating !== null}
            className="flex flex-col items-center gap-1 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 text-center"
          >
            <span className="text-2xl">{t.previewEmoji}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{t.name}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">{t.description}</span>
            {generating === t.id && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400">Génération...</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
