import { useGifStore } from './stores/gifStore';
import { useTheme } from './hooks/useTheme';
import { useClipboardPaste } from './hooks/useClipboardPaste';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import FrameList from './components/FrameList';
import PresetBar from './components/PresetBar';
import SettingsPanel from './components/SettingsPanel';
import AdvancedSettings from './components/AdvancedSettings';
import Preview from './components/Preview';
import GenerateButton from './components/GenerateButton';
import DownloadPanel from './components/DownloadPanel';

export default function App() {
  useTheme();
  useClipboardPaste();
  const frameCount = useGifStore((s) => s.frames.length);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Upload */}
        <section>
          <ImageUploader />
        </section>

        {/* Frames */}
        <FrameList />

        {/* Config - only show when frames exist */}
        {frameCount > 0 && (
          <>
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
              <PresetBar />
              <hr className="border-gray-100 dark:border-gray-700" />
              <SettingsPanel />
              <AdvancedSettings />
            </section>

            {/* Preview */}
            <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <Preview />
            </section>

            {/* Generate */}
            <section>
              <GenerateButton />
            </section>

            {/* Download */}
            <DownloadPanel />

            {/* Email marketing tip */}
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
              <strong>💡 Astuce :</strong> Outlook n'affiche que la 1ère frame de votre GIF.
              Assurez-vous qu'elle est significative et contient votre message principal.
            </div>
          </>
        )}
      </main>

      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-6">
        GIF Maker — 100% côté client, vos images ne quittent jamais votre navigateur.
      </footer>
    </div>
  );
}
