import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { FrameImage } from '../types';

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
      className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
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
      <div className="px-2 py-1 text-xs text-gray-500 truncate">{frame.name}</div>
    </div>
  );
}
