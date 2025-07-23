import { ChapterListReorder } from "./chapter-list-reorder";
import * as React from "react";
import { Chapter } from "@/types/chapter";

interface ChapterListProps {
  chapters: Chapter[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  parentChaptersMap?: Record<string, string>;
}

export const ChapterList = React.memo(function ChapterList({
  chapters,
  onEdit,
  onDelete,
  onView,
  parentChaptersMap = {},
}: ChapterListProps) {
  if (!chapters.length) {
    return <div className="text-gray-500">No chapters found.</div>;
  }

  return (
    <ChapterListReorder 
      chapters={chapters} 
      onEdit={onEdit}
      onDelete={onDelete}
      onView={onView}
      parentChaptersMap={parentChaptersMap}
  />
  );
});
