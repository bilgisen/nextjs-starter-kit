import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface ChapterResponse {
  id: string;
  title: string;
  content: string;
  order: number;
  bookId: string;
  level: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

import BookWithChapters from '@/types/book';

export { BookWithChapters };

export interface Chapter {
  id: string;
  bookId: string;
  userId: string;
  title: string;
  content: string;
  order: number;
  level: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BookWithChapters = Awaited<ReturnType<typeof getBookWithChapters>>;

export async function getBookWithOwnership(slug: string, userId: string) {
  const [book] = await db
    .select()
    .from(books)
    .where(and(
      eq(books.slug, slug),
      eq(books.userId, userId)
    ));

  if (!book) {
    return null;
  }

  return book;
}

export async function getBookWithChapters(slug: string, userId: string): Promise<BookWithChapters | null> {
  try {
    // Get the book with ownership check
    const book = await getBookWithOwnership(slug, userId);
    if (!book) {
      return null;
    }

    // Get all chapters for this book using the API endpoint
    const response = await fetch(`/api/books/${slug}/chapters`);
    if (!response.ok) {
      throw new Error('Failed to fetch chapters');
    }
    const chaptersList = await response.json();

    return {
      ...book,
      createdAt: book.created_at ? new Date(book.created_at) : new Date(),
      updatedAt: book.updated_at ? new Date(book.updated_at) : new Date(),
      chapters: chaptersList.map((ch: ChapterResponse) => ({
        ...ch,
        createdAt: ch.createdAt ? new Date(ch.createdAt) : new Date(),
        updatedAt: ch.updatedAt ? new Date(ch.updatedAt) : new Date(),
      }))
    };
  } catch (error) {
    console.error('Error in getBookWithChapters:', error);
    return null;
  }
}
