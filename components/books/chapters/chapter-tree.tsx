'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState, useEffect } from 'react';
import type { ChapterNode } from '@/types/dnd';
import { buildTree, moveItemToNewParentAndReorder } from '@/lib/utils/tree-utils';
import { ChapterTreeItem } from './chapter-tree-item';

interface Props {
  chapters: ChapterNode[];
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChild?: (id: string) => void;
  onReorder?: (chapters: ChapterNode[]) => void;
}

export function ChapterTree({
  chapters,
  onEdit,
  onView,
  onDelete,
  onAddChild,
  onReorder,
}: Props) {
  // Local state: flat list with order and parent info
  const [items, setItems] = useState<ChapterNode[]>([]);

  // Chapters prop değiştiğinde local state'i güncelle
  useEffect(() => {
    // Eğer chapters zaten flat list ise doğrudan setItems yapabilirsin
    // Yoksa ağaçtan düz liste yap, order ve parent id ayarla
    setItems(chapters);
  }, [chapters]);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // Yardımcı fonksiyon: Yeni parentId ve index hesapla
  function getNewParentIdAndIndex(
    items: ChapterNode[],
    activeId: string,
    overId: string
  ): { newParentId: string | null; newIndex: number } {
    const activeItem = items.find(i => i.id === activeId);
    const overItem = items.find(i => i.id === overId);

    if (!activeItem || !overItem) return { newParentId: null, newIndex: 0 };

    // Aynı parent altında mı?
    if (activeItem.parent_chapter_id === overItem.parent_chapter_id) {
      return {
        newParentId: activeItem.parent_chapter_id,
        newIndex: items
          .filter(i => i.parent_chapter_id === activeItem.parent_chapter_id)
          .findIndex(i => i.id === overId),
      };
    }

    // Eğer overItem'ın çocukları varsa ve drag edilen öğe üzerine bırakıldıysa,
    // dragged öğe overItem'ın child'ı olur:
    const hasChildren = items.some(i => i.parent_chapter_id === overId);

    if (hasChildren) {
      return {
        newParentId: overId,
        newIndex: 0,
      };
    }

    // Diğer durumda, overItem ile aynı parent altında sibling olarak ekle
    return {
      newParentId: overItem.parent_chapter_id,
      newIndex: items
        .filter(i => i.parent_chapter_id === overItem.parent_chapter_id)
        .findIndex(i => i.id === overId),
    };
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
  
    if (!over || active.id === over.id) return;
  
    // active.id ve over.id UniqueIdentifier tipinde, string olarak cast ediyoruz:
    const activeId = String(active.id);
    const overId = String(over.id);
  
    const { newParentId, newIndex } = getNewParentIdAndIndex(items, activeId, overId);
  
    const reordered = moveItemToNewParentAndReorder(items, activeId, newParentId, newIndex);
  
    setItems(reordered);
  
    if (onReorder) {
      onReorder(reordered);
    }
  };

  // Ağaç yapısını oluştur, bunu render için kullanacağız
  const tree = buildTree(items);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {tree.map(chapter => (
            <ChapterTreeItem
              key={chapter.id}
              chapter={chapter}
              level={0}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
