// lib/chapter-url.ts
export function getChapterUrl(
    bookSlug: string, 
    chapterId: string, 
    chapterOrder: number
  ): string {
    const paddedOrder = String(chapterOrder).padStart(3, '0');
    return `/api/books/${bookSlug}/chapters/${chapterId}-${paddedOrder}.html`;
  }
  
  export function getChapterPath(
    bookSlug: string,
    chapterId: string,
    chapterOrder: number
  ): string {
    const paddedOrder = String(chapterOrder).padStart(3, '0');
    return `/books/${bookSlug}/chapters/${chapterId}-${paddedOrder}.html`;
  }