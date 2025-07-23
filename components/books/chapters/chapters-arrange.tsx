'use client';

import { ChapterNode } from '@/types/dnd';
import { RstChapterTree } from './rst-chapter-tree';

interface ChaptersArrangeProps {
  chapters: ChapterNode[];
  onSave: (updatedChapters: ChapterNode[]) => Promise<void>;
  onEdit: (chapterId: string) => void;
  onView: (chapterId: string) => void;
  onDelete: (chapterId: string) => Promise<void>;
  onAddChapter?: (parentId?: string) => void;
  className?: string;
}

export function ChaptersArrange({ 
  chapters = [], 
  onSave, 
  onEdit, 
  onView, 
  onDelete, 
  className = '' 
}: Omit<ChaptersArrangeProps, 'onAddChapter'>) {
  console.log('ChaptersArrange - Received chapters:', chapters);
  return (
    <div className={className}>
      <RstChapterTree 
        chapters={chapters}
        onSave={onSave}
        onEdit={onEdit}
        onView={onView}
        onDelete={onDelete}
        className="border rounded-lg p-4"
      />
    </div>
  );
}
