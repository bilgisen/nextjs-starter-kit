"use server";

import { z } from "zod";
import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { getAuthUser } from "@/lib/with-auth";
import { redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { eq } from 'drizzle-orm';


// Helper function to generate a slug from a title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .trim();
};

// Define the schema for book creation form data
const bookSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  author: z.string().min(1, "Author is required").max(255),
  publisher: z.string().min(1, "Publisher is required").max(255),
  description: z.string().max(1000).optional(),
  isbn: z.string().max(20).optional().nullable(),
  publish_year: z.coerce
    .number()
    .int()
    .min(1000, "Year must be a valid year")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future")
    .optional()
    .nullable(),
  language: z.string().min(2, "Language code must be at least 2 characters").max(10).optional(),
  cover_image_url: z.string().url("Invalid URL").or(z.literal("")).optional().nullable(),
});

/**
 * Server action to create a new book
 * @param formData - The form data containing book information
 */
export const createBook = async (formData: FormData) => {
  const user = await getAuthUser();
  try {
    // Parse and validate the form data
    const parsed = bookSchema.safeParse(Object.fromEntries(formData));

    // If validation fails, throw an error with the validation issues
    if (!parsed.success) {
      const errorMessages = parsed.error.errors.map(e => e.message).join(", ");
      console.error("Validation error:", errorMessages);
      throw new Error(`Validation failed: ${errorMessages}`);
    }

    // Extract the validated data
    const {
      title,
      author,
      publisher,
      description,
      isbn,
      publish_year,
      language,
      cover_image_url,
    } = parsed.data;

    // Generate a slug from the title if not provided
    const slug = generateSlug(title);

    // Check if a book with this slug already exists for the user
    const [existingBook] = await db
      .select()
      .from(books)
      .where(eq(books.slug, slug))
      .limit(1);

    if (existingBook) {
      throw new Error("A book with this title already exists. Please choose a different title.");
    }

    // Create the new book object
    const newBook = {
      id: uuidv4(),
      userId: user.id,
      title,
      slug,
      author,
      publisher,
      description: description ?? null,
      isbn: isbn?.trim() || null,
      publish_year: publish_year ?? null,
      language: language?.trim() || null,
      cover_image_url: cover_image_url?.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the new book into the database
    await db.insert(books).values(newBook);
    
    // Redirect to the new book's page
    redirect(`/dashboard/books/${slug}`);
  } catch (error) {
    console.error("Error in createBook:", error);
    // Re-throw the error to be handled by the UI
    throw error instanceof Error 
      ? error 
      : new Error("An unexpected error occurred while creating the book.");
  }
}
