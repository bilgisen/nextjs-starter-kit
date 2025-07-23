"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { getAuthUser } from "@/lib/with-auth";
import { and, eq } from "drizzle-orm";
import slugify from "slugify";

const bookSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  publisher: z.string().min(1),
  description: z.string().optional(),
  isbn: z.string().optional(),
  publish_year: z.number().int().min(0).optional(),
  language: z.string().min(2).optional(),
  cover_image_url: z.string().url().optional(), // url olarak güncellendi
});

export const updateBook = async (formData: unknown) => {
  const user = await getAuthUser();
  const parsed = bookSchema.safeParse(formData);
  if (!parsed.success) {
    throw new Error("Invalid form data");
  }

  const {
    id,
    title,
    description,
    author,
    publisher,
    isbn,
    publish_year,
    language,
    cover_image_url,
  } = parsed.data;

  // Check if user has permission to edit this book
  const [existingBook] = await db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, user.id)))
    .limit(1);

  if (!existingBook) {
    throw new Error("Book not found or you don't have permission to edit it");
  }

  // Generate slug from title if title is being updated
  const slug = title ? slugify(title, { lower: true, strict: true }) : existingBook.slug;

  try {
    const [updatedBook] = await db
      .update(books)
      .set({
        title: title || existingBook.title,
        description: description ?? existingBook.description,
        author: author || existingBook.author,
        publisher: publisher || existingBook.publisher,
        isbn: isbn ?? existingBook.isbn,
        publish_year: publish_year ?? existingBook.publish_year,
        language: language || existingBook.language,
        cover_image_url: cover_image_url ?? existingBook.cover_image_url,
        slug,
        updated_at: new Date().toISOString(),
      })
      .where(eq(books.slug, slug))
      .returning();

    if (!updatedBook) {
      throw new Error("Failed to update book");
    }

    // Return the updated book and let the client handle the redirect
    return { 
      success: true, 
      book: updatedBook,
      redirectUrl: `/dashboard/books/${slug}`
    };
  } catch (error) {
    console.error("Error updating book:", error);
    throw new Error("Failed to update book. Please try again later.");
  }
};
