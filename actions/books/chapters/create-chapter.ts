"use server";

import { z } from "zod";
import { db } from "@/db/drizzle";
import { chapters, books } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { Chapter } from "@/types/chapter";

// Input validation schema
const createChapterSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  order: z.number().int().min(0, "Order must be a positive number"),
  parentId: z.string().uuid("Invalid parent chapter ID").nullable().optional(),
  level: z.number().int().min(0).default(0),
  bookId: z.string().uuid("Invalid book ID"),
  // Update to accept the actual user ID format from better-auth
  userId: z.string().min(1, "User ID is required"),
});


export const createChapter = async (input: unknown): Promise<Chapter> => {
  console.log("createChapter input:", input);
  
  // Validate input
  const validation = createChapterSchema.safeParse(input);
  if (!validation.success) {
    console.error("Validation error:", validation.error);
    console.error("Input that caused validation error:", input);
    throw new Error("Invalid input: " + validation.error.errors.map(e => e.message).join(", "));
  }
  
  const { bookId, userId, parentId, ...chapterData } = validation.data;
  
  // Ensure level is set with a default value
  if (chapterData.level === undefined || chapterData.level === null) {
    chapterData.level = parentId ? 1 : 0;
  }

  try {
    // Verify book ownership
    const [book] = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.id, bookId),
          eq(books.userId, userId)
        )
      )
      .limit(1);
      
    if (!book) {
      throw new Error("Book not found or access denied");
    }

    // If there's a parent chapter, verify it belongs to the same book
    if (parentId) {
      const [parentChapter] = await db
        .select()
        .from(chapters)
        .where(
          and(
            eq(chapters.id, parentId),
            eq(chapters.book_id, bookId)
          )
        )
        .limit(1);
        
      if (!parentChapter) {
        throw new Error("Parent chapter not found in this book");
      }
    }
    
    // Ensure parentId is either a valid UUID or null
    const parentChapterId = parentId || null;

    // Create the new chapter with proper typing
    const newChapterData = {
      id: uuidv4(),
      book_id: bookId,
      parent_chapter_id: parentChapterId,
      title: chapterData.title,
      content: chapterData.content,
      order: chapterData.order,
      level: chapterData.level,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log("Creating chapter with data:", newChapterData);
    
    // Use type assertion to ensure type safety
    const [newChapter] = await db
      .insert(chapters)
      .values(newChapterData as typeof chapters.$inferInsert)
      .returning();

    return newChapter;
  } catch (error) {
    console.error("Error in createChapter:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while creating the chapter");
  }
};
