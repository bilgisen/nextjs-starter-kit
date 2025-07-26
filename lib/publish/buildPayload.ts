// lib/publish/buildPayload.ts

import { getBookBySlug } from '@/actions/books/get-book-by-slug';
import { getChaptersByBook } from '@/actions/books/get-chapters-by-book';
import type { ChapterWithChildren } from '@/types/chapter';

type ChapterPayload = {
  id: string;
  title: string;
  order: number;
  url: string;
  parent: string | null;
  level: number;
  title_tag: string;
};

export type BookPayload = {
  book: {
    slug: string;
    title: string;
    language: string;
    cover_url: string | null;
    stylesheet_url: string;
    imprint: {
      url: string;
    };
    chapters: ChapterPayload[];
  };
};

/**
 * Builds the base payload for publishing a book
 * @param slug - The slug of the book to build payload for
 * @returns A promise that resolves to the book payload
 */
export async function buildBasePayload(slug: string): Promise<BookPayload> {
  if (!slug) {
    throw new Error('Book slug is required');
  }

  // Get the book with ownership check
  const book = await getBookBySlug(slug);
  if (!book) {
    throw new Error('Book not found or access denied');
  }

  // Get all chapters for the book
  const chapters = await getChaptersByBook(book.id);
  
  // Build chapter payload
  const chapterPayload = chapters.map((chapter: ChapterWithChildren, index: number) => {
    // Calculate heading level: level 1 -> h2, level 2 -> h3, etc., but not exceeding h6
    const headingLevel = Math.min(1 + (chapter.level ?? 1), 6);
    
    return {
      id: chapter.id,
      title: chapter.title,
      order: chapter.order ?? index,
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/books/${slug}/chapters/${chapter.id}/${chapter.id}-${String(index).padStart(3, '0')}.html`,
      parent: chapter.parent_chapter_id ?? null,
      level: chapter.level ?? 0,
      title_tag: `h${headingLevel}`
    };
  });

  return {
    book: {
      slug: book.slug,
      title: book.title,
      language: book.language || 'tr',
      cover_url: book.cover_image_url || null,
      stylesheet_url: `${process.env.NEXT_PUBLIC_BASE_URL}/styles/epub.css`,
      imprint: {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/books/${slug}/imprint.html`,
      },
      chapters: chapterPayload,
    },
  };
}