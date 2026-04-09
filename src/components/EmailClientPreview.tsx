import { useEffect, useState } from 'react';
import { useGifStore } from '../stores/gifStore';

export default function EmailClientPreview() {
  const generatedGif = useGifStore((s) => s.generatedGif);
  const frames = useGifStore((s) => s.frames);
  const [gifUrl, setGifUrl] = useState<string | null>(null);

  useEffect(() => {
    if (generatedGif) {
      const url = URL.createObjectURL(generatedGif);
      setGifUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setGifUrl(null);
    }
  }, [generatedGif]);

  if (!gifUrl || frames.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Aperçu clients email</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Outlook */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-[#0078d4] text-white px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
            <span>📧</span> Outlook (frame statique)
          </div>
          <div className="p-2 bg-white dark:bg-gray-800">
            <img src={frames[0].url} alt="Outlook preview" className="w-full rounded" />
          </div>
          <div className="px-3 py-1.5 text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
            Outlook affiche uniquement la 1ère frame
          </div>
        </div>

        {/* Gmail */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-[#ea4335] text-white px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
            <span>📧</span> Gmail / Apple Mail (animé)
          </div>
          <div className="p-2 bg-white dark:bg-gray-800">
            <img src={gifUrl} alt="Gmail preview" className="w-full rounded" />
          </div>
          <div className="px-3 py-1.5 text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
            Gmail et Apple Mail affichent le GIF animé
          </div>
        </div>
      </div>
    </div>
  );
}
