"use server";

import { z } from "zod";
import { db } from "@/db/drizzle";
import { books, chapters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const deleteChapterSchema = z.object({
  id: z.string().min(1, "Chapter ID is required"),
  bookId: z.string().min(1, "Book ID is required"),
  userId: z.string().min(1, "User ID is required")
});


export async function deleteChapter(params: unknown) {
  try {
    // Validate input
    const result = deleteChapterSchema.safeParse(params);
    if (!result.success) {
      throw new Error(
        `Invalid parameters: ${result.error.errors.map(e => e.message).join(', ')}`
      );
    }
    
    const { id, bookId, userId } = result.data;

    // First verify the chapter exists and belongs to the user's book
    const [chapter] = await db
      .select()
      .from(chapters)
      .where(
        and(
          eq(chapters.id, id),
          eq(chapters.bookId, bookId) // Using bookId (camelCase) as per schema
        )
      )
      .limit(1);

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    // Verify the book belongs to the user
    const [book] = await db
      .select({ id: books.id })
      .from(books)
      .where(
        and(
          eq(books.id, bookId),
          eq(books.userId, userId)
        )
      )
      .limit(1);

    if (!book) {
      throw new Error("You don't have permission to delete chapters from this book");
    }

    // Delete the chapter
    await db
      .delete(chapters)
      .where(
        and(
          eq(chapters.id, id),
          eq(chapters.bookId, bookId)
        )
      );

    // Invalidate the book page cache
    revalidatePath(`/dashboard/books/${bookId}`);
    revalidatePath(`/api/books/${bookId}/chapters`);

    return { success: true };
  } catch (error) {
    console.error("Error in deleteChapter:", error);
    throw error instanceof Error 
      ? error 
      : new Error("An unknown error occurred while deleting the chapter");
  }
}
