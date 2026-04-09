import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FrameImage } from '../types';
import FrameDurationSlider from './FrameDurationSlider';

interface Props {
  frame: FrameImage;
  index: number;
  onRemove: (id: string) => void;
}

export default function FrameItem({ frame, index, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: frame.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <img
          src={frame.url}
          alt={frame.name}
          className="w-full h-20 object-cover"
        />
        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
          {index + 1}
        </div>
        {index === 0 && (
          <div className="absolute top-1 right-7 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-0.5">
            👁 Outlook
          </div>
        )}
      </div>
      <button
        onClick={() => onRemove(frame.id)}
        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        title="Supprimer"
      >
        ×
      </button>
      <div className="px-1 py-0.5">
        <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate px-0.5">{frame.name}</div>
        <FrameDurationSlider frameId={frame.id} duration={frame.duration} />
      </div>
    </div>
  );
}
