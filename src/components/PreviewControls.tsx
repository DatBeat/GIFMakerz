interface Props {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPrevFrame: () => void;
  onNextFrame: () => void;
  currentFrame: number;
  totalFrames: number;
}

export default function PreviewControls({
  isPlaying,
  onTogglePlay,
  onPrevFrame,
  onNextFrame,
  currentFrame,
  totalFrames,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrevFrame}
        disabled={isPlaying}
        className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
        title="Frame précédente"
      >
        &#9668;
      </button>
      <button
        onClick={onTogglePlay}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 min-w-[60px]"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button
        onClick={onNextFrame}
        disabled={isPlaying}
        className="px-2 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
        title="Frame suivante"
      >
        &#9658;
      </button>
      <span className="text-xs text-gray-500 ml-2">
        {currentFrame + 1} / {totalFrames}
      </span>
    </div>
  );
}
