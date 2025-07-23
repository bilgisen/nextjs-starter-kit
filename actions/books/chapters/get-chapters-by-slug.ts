"use server";

import { db } from "@/db/drizzle";
import { chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { books } from "@/db/schema";

export async function getChaptersByBookSlug(bookSlug: string) {
  const result = await db
    .select()
    .from(chapters)
    .leftJoin(books, eq(chapters.book_id, books.id))
    .where(eq(books.slug, bookSlug))
    .orderBy(chapters.order);

  return result.map((row) => row.chapters);
}
