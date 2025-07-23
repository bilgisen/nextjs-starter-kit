import { type ChapterWithChildren } from "@/types/chapter";
import { cn } from "@/lib/utils";

type FullChaptersProps = {
  chapters: ChapterWithChildren[];
  className?: string;
  showTitle?: boolean;
  showContent?: boolean;
};

export function FullChapters({ 
  chapters, 
  className, 
  showTitle = true, 
  showContent = true 
}: FullChaptersProps) {
  // Flatten the chapters with proper hierarchy
  const renderChapters = (chapterList: ChapterWithChildren[], level = 0) => {
    return chapterList.map((chapter) => {
      const hasChildren = chapter.children_chapters && chapter.children_chapters.length > 0;
      
      return (
        <div key={chapter.id} className={cn("w-full")}>
          {showTitle && (
            <div 
              className={cn("py-2 font-medium", {
                "text-2xl mt-6": level === 0,
                "text-xl mt-4 ml-4": level === 1,
                "text-lg mt-3 ml-8": level === 2,
                "text-base mt-2 ml-12": level >= 3,
              })}
            >
              {chapter.title}
            </div>
          )}
          
          {showContent && chapter.content && (
            <div 
              className={cn("prose dark:prose-invert max-w-none", {
                "ml-4": level >= 1,
                "mt-2": showTitle,
              })}
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          )}
          
          {hasChildren && (
            <div className={cn({
              "ml-4": level > 0,
            })}>
              {renderChapters(chapter.children_chapters, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Get root level chapters (no parent)
  const rootChapters = chapters.filter(chapter => !chapter.parent_chapter_id);
  
  // Sort chapters by order
  const sortedChapters = [...rootChapters].sort((a, b) => a.order - b.order);

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {sortedChapters.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No chapters found</p>
      ) : (
        <div className="space-y-6">
          {renderChapters(sortedChapters)}
        </div>
      )}
    </div>
  );
}
