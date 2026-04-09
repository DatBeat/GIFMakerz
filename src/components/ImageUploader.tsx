import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useGifStore } from '../stores/gifStore';

const ACCEPTED = { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] };
const MAX_FILES = 20;

export default function ImageUploader() {
  const addFrames = useGifStore((s) => s.addFrames);
  const frameCount = useGifStore((s) => s.frames.length);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        addFrames(acceptedFiles);
      }
    },
    [addFrames]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: MAX_FILES - frameCount,
    disabled: frameCount >= MAX_FILES,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
          : frameCount >= MAX_FILES
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60 dark:border-gray-700 dark:bg-gray-800'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-gray-800'
      }`}
    >
      <input {...getInputProps()} />
      <div className="space-y-2">
        <div className="text-4xl">📁</div>
        <p className="text-gray-700 dark:text-gray-200 font-medium">
          {isDragActive ? 'Déposez vos images ici...' : 'Glissez vos images ici'}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm">ou cliquez / collez (Ctrl+V)</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs">
          PNG, JPG, WEBP • 2 à 20 images ({frameCount}/20)
        </p>
      </div>
    </div>
  );
}
