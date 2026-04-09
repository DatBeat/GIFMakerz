// src/components/DownloadPanel.tsx
import { useGifStore } from '../stores/gifStore';
import { formatSize, getSizeCategory } from '../utils/weightEstimator';

export default function DownloadPanel() {
  const generatedGif = useGifStore((s) => s.generatedGif);
  const metadata = useGifStore((s) => s.generatedMetadata);

  if (!generatedGif || !metadata) return null;

  const isOverweight = metadata.size > 1024 * 1024;
  const sizeCategory = getSizeCategory(metadata.size);

  function handleDownload() {
    const url = URL.createObjectURL(generatedGif!);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-gif-${Date.now()}.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const sizeColors = {
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100">GIF généré avec succès !</h3>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="text-gray-500 dark:text-gray-400">Poids</div>
        <div className={`font-mono font-medium ${sizeColors[sizeCategory]}`}>
          {formatSize(metadata.size)}
        </div>
        <div className="text-gray-500 dark:text-gray-400">Dimensions</div>
        <div className="font-mono dark:text-gray-200">{metadata.width} × {metadata.height}px</div>
        <div className="text-gray-500 dark:text-gray-400">Frames</div>
        <div className="font-mono dark:text-gray-200">{metadata.frameCount}</div>
        <div className="text-gray-500 dark:text-gray-400">Durée totale</div>
        <div className="font-mono dark:text-gray-200">{(metadata.totalDuration / 1000).toFixed(1)}s</div>
      </div>

      {isOverweight && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
          <strong>⚠ Attention :</strong> Ce GIF dépasse 1 MB. Certains clients email (Gmail, Outlook)
          pourraient ne pas l'afficher correctement. Réduisez la qualité, les dimensions ou le nombre
          de frames pour un meilleur résultat.
        </div>
      )}

      <button
        onClick={handleDownload}
        className="w-full py-3 px-6 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors shadow-md hover:shadow-lg"
      >
        Télécharger le GIF
      </button>
    </div>
  );
}
