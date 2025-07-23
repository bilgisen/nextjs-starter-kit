"use server";

import { z } from "zod";
import { db } from "@/db/drizzle";
import { chapters, books } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const getChapterSchema = z.object({
  id: z.string().min(1, "Chapter ID is required"),
  bookId: z.string().min(1, "Book ID is required"),
  userId: z.string().min(1, "User ID is required"),
});


export const getChapter = async (params: unknown): Promise<{
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
  // Add these fields to match the database schema
  book_id: string;
  user_id: string;
  parent_chapter_id: string | null;
  created_at: Date;
  updated_at: Date;
}> => {
  // Validate input
  const result = getChapterSchema.safeParse(params);
  if (!result.success) {
    throw new Error(`Invalid parameters: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  
  const { id, bookId, userId } = result.data;

  try {
    // Check if user owns the book
    const [book] = await db
      .select({ id: books.id, userId: books.userId })
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      throw new Error("Book not found");
    }

    if (book.userId !== userId) {
      throw new Error("You do not have permission to view chapters in this book");
    }

    // Get the chapter with user_id from the book
    const [chapter] = await db
      .select({
        id: chapters.id,
        book_id: chapters.book_id,
        user_id: books.userId, // Include user_id from the books table
        title: chapters.title,
        content: chapters.content,
        order: chapters.order,
        level: chapters.level,
        parent_id: chapters.parent_chapter_id,
        created_at: chapters.created_at,
        updated_at: chapters.updated_at
      })
      .from(chapters)
      .innerJoin(books, eq(chapters.book_id, books.id))
      .where(
        and(
          eq(chapters.id, id),
          eq(chapters.book_id, bookId)
        )
      )
      .limit(1);

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    // Map the database fields to the expected return type
    return {
      id: chapter.id,
      bookId: chapter.book_id,
      userId: chapter.user_id,
      title: chapter.title,
      content: chapter.content,
      order: chapter.order || 0,
      level: chapter.level || 0,
      parentId: chapter.parent_chapter_id,
      parent_chapter_id: chapter.parent_chapter_id,
      book_id: chapter.book_id,
      user_id: chapter.user_id,
      created_at: chapter.created_at,
      updated_at: chapter.updated_at,
      createdAt: chapter.created_at,
      updatedAt: chapter.updated_at
    };
  } catch (error) {
    console.error("Error in getChapter:", error);
    throw error instanceof Error 
      ? error 
      : new Error("An unknown error occurred while fetching the chapter");
  }
};
