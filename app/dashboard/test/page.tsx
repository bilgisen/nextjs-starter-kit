'use client';

import { useState } from 'react';
import { RstChapterTree } from '@/components/books/chapters/rst-chapter-tree';
import type { ChapterNode } from '@/types/dnd';

const mockChapters: ChapterNode[] = [
  { id: '1', title: 'Bölüm 1', parent_chapter_id: null, order: 0 },
  { id: '2', title: 'Bölüm 2', parent_chapter_id: null, order: 1 },
  { id: '3', title: 'Alt Bölüm 1.1', parent_chapter_id: '1', order: 0 },
  { id: '4', title: 'Alt Bölüm 2.1', parent_chapter_id: '2', order: 0 },
  { id: '5', title: 'Alt Bölüm 2.2', parent_chapter_id: '2', order: 1 },
];

export default function TestPage() {
  const [chapters, setChapters] = useState<ChapterNode[]>(mockChapters);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
        RST Chapter Tree Testi
      </h1>

      <RstChapterTree chapters={chapters} onSave={setChapters} />

      <div className="rounded-md bg-gray-100 dark:bg-gray-800 p-4 text-sm text-gray-800 dark:text-gray-100 font-mono overflow-auto">
        <pre>{JSON.stringify(chapters, null, 2)}</pre>
      </div>
    </div>
  );
}
