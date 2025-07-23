'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

type DropPosition = 'before' | 'after' | 'inside' | 'none';

interface ChapterDropZoneProps {
  id: string;
  parentId?: string | null;
  position: DropPosition;
  level: number;
  isLast?: boolean;
  disabled?: boolean;
}

export function ChapterDropZone({
  id,
  parentId,
  position,
  level,
  isLast = false,
  disabled = false,
}: ChapterDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `drop-${position}-${id}`,
    data: {
      accepts: ['chapter'],
      parentId: position === 'inside' ? id : parentId,
      position,
    },
    disabled,
  });

  const isActive = isOver && !disabled;
  const indent = level * 20; // 20px per level

  // Only show the drop indicator if it's over this zone
  if (!isActive) return null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-0.5 my-1 transition-colors',
        {
          'bg-primary': isActive,
          'ml-8': position === 'inside', // Add more margin for inside drops
        },
        position === 'inside' && 'mx-2 rounded',
      )}
      style={{
        marginLeft: position === 'inside' ? `${indent + 8}px` : `${indent + 28}px`,
        marginRight: '0.5rem',
      }}
      aria-hidden="true"
    >
      <div className={cn(
        'h-full w-full relative',
        {
          'bg-primary': isActive,
        }
      )}>
        {position === 'inside' && (
          <div className="absolute inset-0 bg-primary/10 rounded" />
        )}
      </div>
    </div>
  );
}

// A component to render all possible drop zones for a chapter
interface ChapterDropZonesProps {
  id: string;
  parentId: string | null;
  level: number;
  isFirst?: boolean;
  isLast?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
}

export function ChapterDropZones({
  id,
  parentId,
  level,
  isFirst = false,
  isLast = false,
  hasChildren = false,
  isExpanded = true,
}: ChapterDropZonesProps) {
  return (
    <>
      {/* Before zone (only show if not the first child) */}
      {!isFirst && (
        <ChapterDropZone
          id={id}
          parentId={parentId}
          position="before"
          level={level}
        />
      )}

      {/* Inside zone (only show if has children and is expanded) */}
      {hasChildren && isExpanded && (
        <ChapterDropZone
          id={id}
          parentId={id}
          position="inside"
          level={level + 1}
        />
      )}

      {/* After zone (only show if it's the last child or has no children) */}
      {(isLast || !hasChildren) && (
        <ChapterDropZone
          id={id}
          parentId={parentId}
          position="after"
          level={level}
        />
      )}
    </>
  );
}
