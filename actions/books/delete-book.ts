"use server";

import { withAuth } from "@/lib/with-auth";
import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Deletes a book by its slug
 * @param user - The authenticated user
 * @param slug - The slug of the book to delete
 * @returns True if the book was deleted, false otherwise
 */
export const deleteBook = withAuth(async (user, slug: string) => {
  try {
    // First verify the book belongs to the current user
    const [book] = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.slug, slug),
          eq(books.userId, user.id)
        )
      )
      .limit(1);

    if (!book) {
      console.error(`Book not found or access denied: ${slug} for user ${user.id}`);
      return false;
    }

    // Delete the book
    await db
      .delete(books)
      .where(
        and(
          eq(books.slug, slug),
          eq(books.userId, user.id)
        )
      );

    return true;
  } catch (error) {
    console.error('Error deleting book:', error);
    return false;
  }
});