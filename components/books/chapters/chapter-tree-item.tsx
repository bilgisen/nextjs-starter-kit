'use client';

import React, { useState } from 'react';
import { ChapterNode } from '@/types/dnd';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  chapter: ChapterNode;
  level: number;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild?: (id: string) => void;
}

export function ChapterTreeItem({
  chapter,
  level,
  onEdit,
  onView,
  onDelete,
  onAddChild,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  // Sürüklenebilir item (draggable)
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: chapter.id,
    data: {
      parentId: chapter.parent_chapter_id,
      type: 'chapter-item',
    },
  });

  // Alt öğe için drop bölgesi (droppable)
  const {
    isOver: isOverChildDrop,
    setNodeRef: setDroppableRef,
  } = useDroppable({
    id: chapter.id + '-child-drop',
    data: {
      parentId: chapter.id,
      type: 'chapter-child-drop',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasChildren = chapter.children && chapter.children.length > 0;

  return (
    <div className="flex flex-col pl-2">
      {/* Draggable item */}
      <div
        ref={setDraggableRef}
        style={style}
        className={clsx('flex items-center gap-2 rounded p-1 cursor-grab select-none', {
          'pl-4': level > 0,
          'bg-blue-100': isDragging,
        })}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground transition"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-[16px]" />
        )}

        <span
          {...attributes}
          {...listeners}
          aria-label="Drag handle"
          className="text-muted-foreground"
        >
          <GripVertical size={16} />
        </span>

        <span className="text-sm">{chapter.title}</span>
      </div>

      {/* Alt öğe drop bölgesi (buraya bırakınca alt öğe olarak eklenir) */}
      <div
        ref={setDroppableRef}
        className={clsx(
          'h-4 rounded border border-dashed border-transparent',
          isOverChildDrop && 'border-blue-400 bg-blue-50',
          'ml-6 mt-1'
        )}
      >
        {/* Buraya bırakılınca parent değişecek */}
      </div>

      {/* Çocuklar (varsa) */}
      {expanded && hasChildren && (
        <div className="ml-6 space-y-1">
          {chapter.children!.map((child) => (
            <ChapterTreeItem
              key={child.id}
              chapter={child}
              level={level + 1}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}
