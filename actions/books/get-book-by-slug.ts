"use server";

import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/actions/auth/get-session";
import type { Book } from "@/types/book";

/**
 * Fetches a book by its slug for the current user
 * @param slug - The slug of the book to fetch
 * @returns The book if found and belongs to the current user, null otherwise
 */
export async function getBookBySlug(slug: string) {
  try {
    if (!slug) {
      console.error('No slug provided to getBookBySlug');
      return null;
    }

    const session = await getSession();
    const userId = session?.user?.id;

    if (!userId) {
      console.error('No user ID in session');
      return null;
    }

    const [book] = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.slug, slug),
          eq(books.userId, userId)
        )
      )
      .limit(1);

    if (!book) return null;

    // Map database fields to Book type
    return {
      ...book,
      // Map user_id to both user_id and userId for compatibility
      user_id: book.user_id,
      userId: book.user_id,
      // Ensure all fields that could be null in the DB are properly typed
      description: book.description || null,
      isbn: book.isbn || null,
      publish_year: book.publish_year || null,
      language: book.language || null,
      cover_image_url: book.cover_image_url || null,
    } as Book;
  } catch (error) {
    console.error('Error fetching book by slug:', error);
    return null;
  }
}
