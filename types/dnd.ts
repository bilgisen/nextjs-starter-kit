// types/dnd.ts

export interface ChapterNode {
  id: string;
  title: string;
  parent_chapter_id: string | null;
  order?: number;
  level?: number;
  children?: ChapterNode[];
}
