import { useState } from 'react';
import type { GifMetadata } from '../types';

interface Props {
  metadata: GifMetadata;
}

export default function CopyHtmlSnippet({ metadata }: Props) {
  const [copied, setCopied] = useState(false);

  const html = `<img src="YOUR_GIF_URL_HERE" width="${metadata.width}" height="${metadata.height}" alt="Animated GIF" style="display:block;max-width:100%;height:auto;border:0;" />`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = html;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Code HTML pour email</h4>
        <button
          onClick={handleCopy}
          className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
            copied
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {copied ? '✓ Copié !' : 'Copier le HTML'}
        </button>
      </div>
      <pre className="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 overflow-x-auto text-gray-600 dark:text-gray-400 font-mono">
        {html}
      </pre>
      <p className="text-xs text-gray-400 dark:text-gray-500">
        Remplacez YOUR_GIF_URL_HERE par l'URL de votre GIF hébergé.
      </p>
    </div>
  );
}
