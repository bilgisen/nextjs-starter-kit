"use server";

import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

export const getBookById = cache(async (id: string) => {
  const [book] = await db.select().from(books).where(eq(books.id, id)).limit(1);
  return book;
});
