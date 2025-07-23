"use server";

import { z } from "zod";
import { db } from "@/db/drizzle";
import { books, chapters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const updateChapterSchema = z.object({
  id: z.string().min(1, "Chapter ID is required"),
  bookId: z.string().min(1, "Book ID is required"),
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title cannot be empty").optional(),
  content: z.string().min(1, "Content cannot be empty").optional(),
  order: z.number().int().min(0, "Order must be a non-negative integer").optional(),
  parentId: z.string().uuid("Invalid parent chapter ID").nullable().optional(),
  level: z.number().int().min(0, "Level must be a non-negative integer").optional(),
  // Add these fields to match the database schema
  book_id: z.string().optional(),
  user_id: z.string().optional(),
  parent_chapter_id: z.string().uuid("Invalid parent chapter ID").nullable().optional()
});

export async function updateChapter(params: unknown) {
  try {
    // Log the incoming params for debugging
    console.log('updateChapter params:', JSON.stringify(params, null, 2));
    
    // Validate input
    const result = updateChapterSchema.safeParse(params);
    if (!result.success) {
      // Type assertion for params to indexable type
      type Indexable = { [key: string]: unknown };
      const errorDetails = result.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        received: e.path.reduce<unknown>((obj, key) => {
          if (typeof obj === 'object' && obj !== null && key in (obj as Indexable)) {
            return (obj as Indexable)[key];
          }
          return undefined;
        }, params)
      }));
      
      console.error('Validation errors:', JSON.stringify(errorDetails, null, 2));
      throw new Error(
        `Invalid parameters: ${errorDetails.map(e => `${e.path} (${e.message})`).join(', ')}`
      );
    }
    
    // Get the user ID from either userId or user_id field
    const { id, bookId, userId, user_id, ...updates } = result.data;
    const effectiveUserId = userId || user_id;
    
    if (!effectiveUserId) {
      throw new Error("User ID is required");
    }

    // First verify the chapter exists and belongs to the user's book
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(
        and(
          eq(chapters.id, id),
          eq(chapters.book_id, bookId) // Using book_id as per database schema
        )
      )
      .limit(1);

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    // Verify the book belongs to the user
    const [book] = await db
      .select({ id: books.id, slug: books.slug })
      .from(books)
      .where(
        and(
          eq(books.id, bookId),
          eq(books.userId, effectiveUserId)
        )
      )
      .limit(1);

    if (!book) {
      throw new Error("You don't have permission to update chapters in this book");
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      ...updates,
      updated_at: new Date()
    };

    // Ensure we're using the correct field name for the database
    if ('parentId' in updateData) {
      updateData.parent_chapter_id = updateData.parentId;
      delete updateData.parentId;
    }

    console.log('Updating chapter with data:', JSON.stringify(updateData, null, 2));

    // Update the chapter
    const [updatedChapter] = await db
      .update(chapters)
      .set(updateData)
      .where(
        and(
          eq(chapters.id, id),
          eq(chapters.book_id, bookId)
        )
      )
      .returning();

    // Invalidate the cache
    revalidatePath(`/dashboard/books/${book.slug}`);
    revalidatePath(`/api/books/${book.slug}/chapters`);

    return updatedChapter;
  } catch (error) {
    console.error("Error in updateChapter:", error);
    throw error instanceof Error 
      ? error 
      : new Error("An unknown error occurred while updating the chapter");
  }
}
