import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { books, chapters } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/get-user";
import { isUUID } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is resolved
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the ID is a valid UUID
    const isUuid = isUUID(id);
    
    // First verify the book exists and belongs to the user
    const [book] = await db
      .select()
      .from(books)
      .where(
        and(
          isUuid ? eq(books.id, id) : eq(books.slug, id),
          eq(books.userId, user.id)
        )
      )
      .limit(1);

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Fetch chapters for the book
    const chaptersList = await db
      .select()
      .from(chapters)
      .where(eq(chapters.book_id, book.id))
      .orderBy(chapters.order);

    return NextResponse.json(chaptersList);
  } catch (error) {
    console.error('Error fetching chapters by book ID:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch chapters",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
