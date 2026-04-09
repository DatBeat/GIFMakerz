import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useGifStore } from '../stores/gifStore';
import FrameItem from './FrameItem';

export default function FrameList() {
  const frames = useGifStore((s) => s.frames);
  const reorderFrames = useGifStore((s) => s.reorderFrames);
  const removeFrame = useGifStore((s) => s.removeFrame);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (frames.length === 0) return null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = frames.findIndex((f) => f.id === active.id);
      const newIndex = frames.findIndex((f) => f.id === over.id);
      reorderFrames(oldIndex, newIndex);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Frames ({frames.length})
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">Glissez pour réorganiser</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={frames.map((f) => f.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {frames.map((frame, index) => (
              <FrameItem
                key={frame.id}
                frame={frame}
                index={index}
                onRemove={removeFrame}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
