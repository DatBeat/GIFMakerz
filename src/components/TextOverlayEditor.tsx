import { useState } from 'react';
import { useGifStore } from '../stores/gifStore';
import type { TextOverlay } from '../types';

export default function TextOverlayEditor() {
  const frames = useGifStore((s) => s.frames);
  const addTextOverlay = useGifStore((s) => s.addTextOverlay);
  const removeTextOverlay = useGifStore((s) => s.removeTextOverlay);
  const updateTextOverlay = useGifStore((s) => s.updateTextOverlay);
  const [selectedFrame, setSelectedFrame] = useState<string | 'all'>('all');
  const [text, setText] = useState('');

  if (frames.length === 0) return null;

  function handleAdd() {
    if (!text.trim()) return;

    const overlay: TextOverlay = {
      id: crypto.randomUUID(),
      text: text.trim(),
      fontSize: 32,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.5)',
      position: 'center',
      bold: true,
    };

    if (selectedFrame === 'all') {
      frames.forEach((f) => addTextOverlay(f.id, { ...overlay, id: crypto.randomUUID() }));
    } else {
      addTextOverlay(selectedFrame, overlay);
    }
    setText('');
  }

  const targetFrames = selectedFrame === 'all' ? frames : frames.filter((f) => f.id === selectedFrame);
  const overlays = targetFrames.flatMap((f) =>
    (f.textOverlays || []).map((o) => ({ ...o, frameId: f.id, frameName: f.name }))
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
        <span>✏️</span> Texte sur les frames
      </h3>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedFrame}
          onChange={(e) => setSelectedFrame(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes les frames</option>
          {frames.map((f, i) => (
            <option key={f.id} value={f.id}>Frame {i + 1} — {f.name}</option>
          ))}
        </select>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Votre texte..."
          className="flex-1 min-w-[150px] border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="px-3 py-1.5 text-sm rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          Ajouter
        </button>
      </div>

      {overlays.length > 0 && (
        <div className="space-y-2">
          {overlays.map((o) => (
            <div key={o.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-sm">
              <span className="text-xs text-gray-400 dark:text-gray-500">{o.frameName}</span>
              <span className="font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">"{o.text}"</span>

              <select
                value={o.position}
                onChange={(e) => updateTextOverlay(o.frameId, o.id, { position: e.target.value as 'top' | 'center' | 'bottom' })}
                className="text-xs border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="top">Haut</option>
                <option value="center">Centre</option>
                <option value="bottom">Bas</option>
              </select>

              <input
                type="color"
                value={o.color}
                onChange={(e) => updateTextOverlay(o.frameId, o.id, { color: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border-0"
                title="Couleur du texte"
              />

              <input
                type="number"
                value={o.fontSize}
                onChange={(e) => updateTextOverlay(o.frameId, o.id, { fontSize: Number(e.target.value) })}
                className="w-12 text-xs border border-gray-200 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:text-gray-200 text-center"
                min={8}
                max={120}
                title="Taille"
              />

              <button
                onClick={() => removeTextOverlay(o.frameId, o.id)}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
