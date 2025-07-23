// components/books/chapters/sortable-chapter.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { GripVertical, Eye, Pencil, Trash2, ChevronDown, ChevronRight, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import type { ChapterWithChildren } from "@/types/chapter";
import { cn } from "@/lib/utils";

interface SortableChapterProps {
  chapter: ChapterWithChildren;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void | Promise<void>;
  allChapters?: ChapterWithChildren[];
  onAddChild?: (parentId: string) => void | Promise<void>;
  level?: number;
}

export default function SortableChapter({ 
  chapter, 
  onView, 
  onEdit, 
  onDelete,
  allChapters = [],
  level = 0,
  onAddChild
}: SortableChapterProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({
    id: chapter.id,
    data: {
      type: 'chapter',
      chapter: {
        ...chapter,
        level
      },
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 'auto',
    position: 'relative' as const,
  };

  const parentChapter = allChapters?.find(c => c.id === chapter.parent_chapter_id);
  const hasChildren = Array.isArray(chapter.children_chapters) && chapter.children_chapters.length > 0;

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(chapter.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(chapter.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await onDelete(chapter.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddChild = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onAddChild) return;
    
    try {
      setIsAddingChild(true);
      await onAddChild(chapter.id);
    } finally {
      setIsAddingChild(false);
    }
  };

  return (
    <div className="space-y-1">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group border rounded-lg px-4 py-2 bg-card text-card-foreground flex items-center justify-between shadow-sm hover:shadow transition-all",
          isDragging && 'ring-2 ring-primary',
          isDragging ? 'opacity-50' : 'opacity-100'
        )}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex items-center" style={{ marginLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-6" />
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 p-0 cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag to reorder"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </Button>
          </div>
          
          <div 
            className="flex-1 min-w-0 cursor-pointer"
            onClick={handleView}
          >
            <div className="font-medium truncate">{chapter.title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {chapter.id}
            </div>
          </div>
          
          <div className="w-48 px-2 text-sm text-muted-foreground truncate">
            {parentChapter ? parentChapter.title : 'Top Level'}
          </div>
          
          <div className="w-16 text-center text-sm text-muted-foreground">
            {level}
          </div>
          
          <div className="w-16 text-center text-sm text-muted-foreground">
            {chapter.order}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {onAddChild && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={handleAddChild}
                disabled={isAddingChild}
                title="Add subchapter"
              >
                {isAddingChild ? (
                  <Plus className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={handleView}
              title="View"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={handleEdit}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && chapter.children_chapters && (
        <div className="pl-6 border-l-2 border-muted-foreground/20 ml-6">
          {chapter.children_chapters
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((child) => (
              <SortableChapter
                key={child.id}
                chapter={child}
                allChapters={allChapters}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}
