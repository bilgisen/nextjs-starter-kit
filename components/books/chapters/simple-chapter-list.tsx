import { type ChapterWithChildren } from "@/types/chapter";
import { cn } from "@/lib/utils";

type SimpleChapterListProps = {
  chapters: ChapterWithChildren[];
  className?: string;
};

export function SimpleChapterList({ chapters, className }: SimpleChapterListProps) {
  // Debug logging
  console.log('SimpleChapterList received chapters:', JSON.stringify(chapters, null, 2));
  
  // If no chapters, show empty state
  if (!chapters || chapters.length === 0) {
    console.log('No chapters provided to SimpleChapterList');
    return <p className="text-sm text-muted-foreground">No chapters found</p>;
  }

  // Recursive function to render a chapter and its children
  const renderChapter = (chapter: ChapterWithChildren, level = 0) => {
    const hasChildren = chapter.children_chapters && chapter.children_chapters.length > 0;
    
    console.log(`Rendering chapter ${chapter.id} (${chapter.title}) at level ${level} with ${hasChildren ? chapter.children_chapters!.length : 0} children`);
    
    return (
      <div key={chapter.id} className={cn("py-1", {
        "ml-4 pl-4 border-l-2 border-muted": level > 0,
      })}>
        <div className="flex items-center py-1.5 text-sm">
          <span className="font-medium">{chapter.title}</span>
          {/* Debug info - can be removed in production */}
          <span className="ml-2 text-xs text-muted-foreground">(Order: {chapter.order})</span>
          {chapter.parent_chapter_id && (
            <span className="ml-2 text-xs text-muted-foreground">
              Parent: {chapter.parent_chapter_id}
            </span>
          )}
        </div>
        
        {hasChildren && (
          <div className="mt-1 space-y-1">
            {chapter.children_chapters!
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(child => renderChapter(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Sort the root chapters by order
  const sortedChapters = [...chapters].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  console.log(`Rendering ${sortedChapters.length} root chapters`);
  
  return (
    <div className={cn("space-y-2", className)}>
      {sortedChapters.map(chapter => renderChapter(chapter))}
    </div>
  );
}
