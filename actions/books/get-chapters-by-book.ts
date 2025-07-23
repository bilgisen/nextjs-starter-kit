"use server";

import { db } from "@/db/drizzle";
import { getSession } from "@/actions/auth/get-session";
import type { ChapterWithChildren } from "@/types/chapter";

/**
 * Fetches all chapters for a book with their hierarchy
 * @param bookId - The ID of the book to fetch chapters for
 * @returns An array of chapters with their children
 */
export async function getChaptersByBook(bookId: string): Promise<ChapterWithChildren[]> {
  try {
    if (!bookId) {
      console.error('No bookId provided to getChaptersByBook');
      return [];
    }

    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.error('No user ID in session');
      return [];
    }

    console.log(`Fetching chapters for book ${bookId} and user ${userId}`);
    
    // First, get all chapters for the book
    const allChapters = await db.query.chapters.findMany({
      where: (chapters, { eq }) => eq(chapters.book_id, bookId),
      with: {
        parent_chapter: true,
      },
      orderBy: (chapters, { asc }) => [asc(chapters.order)],
    });
    
    // Filter by user_id in memory since Drizzle's query builder is having issues with the complex where clause
    const filteredChapters = allChapters.filter(chapter => {
      // If there's no user_id in the chapter (shouldn't happen), include it
      if (!('user_id' in chapter)) return true;
      // Otherwise check if it matches the current user
      return (chapter as any).user_id === userId;
    });

    console.log(`Found ${allChapters.length} chapters:`, 
      allChapters.map(c => ({
        id: c.id,
        title: c.title,
        parent_chapter_id: c.parent_chapter_id,
        order: c.order
      }))
    );

    // First, create a map of all chapters by their ID for easy lookup
    const chaptersById = filteredChapters.reduce<Record<string, ChapterWithChildren>>((acc, chapter) => {
      acc[chapter.id] = {
        ...chapter,
        children_chapters: []
      };
      return acc;
    }, {});
    
    // Now build the hierarchy by assigning children to their parents
    const rootChapters: ChapterWithChildren[] = [];
    
    allChapters.forEach(chapter => {
      const current = chaptersById[chapter.id];
      
      // If this chapter has a parent, add it to the parent's children
      if (chapter.parent_chapter_id && chaptersById[chapter.parent_chapter_id]) {
        if (!chaptersById[chapter.parent_chapter_id].children_chapters) {
          chaptersById[chapter.parent_chapter_id].children_chapters = [];
        }
        chaptersById[chapter.parent_chapter_id].children_chapters!.push(current);
      } else {
        // No parent or parent not found, this is a root chapter
        rootChapters.push(current);
      }
    });
    
    // Sort chapters by order
    const sortChapters = (chapters: ChapterWithChildren[]): ChapterWithChildren[] => {
      return [...chapters]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(chapter => ({
          ...chapter,
          children_chapters: chapter.children_chapters ? sortChapters(chapter.children_chapters) : []
        }));
    };
    
    const sortedRootChapters = sortChapters(rootChapters);
    
    console.log('Final hierarchy:', JSON.stringify({
      rootChapters: sortedRootChapters.map(c => ({
        id: c.id,
        title: c.title,
        order: c.order,
        parent_chapter_id: c.parent_chapter_id,
        childrenCount: c.children_chapters?.length || 0
      }))
    }, null, 2));
    
    return sortedRootChapters;
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return [];
  }
}
