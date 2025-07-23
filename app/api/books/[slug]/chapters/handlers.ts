import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { chapters, books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createChapter } from "@/actions/books/chapters/create-chapter";
import { getAuthUser } from "@/lib/with-auth";
import type { NextRequest } from "next/server";

// Helper function to get book by slug with ownership check
async function getBookWithOwnership(slug: string, userId: string) {
  // Drizzle ORM automatically maps 'user_id' to 'userId' because of the schema definition
  const [book] = await db
    .select()
    .from(books)
    .where(eq(books.slug, slug));

  if (!book) {
    throw new Error("Book not found");
  }

  // Check if the current user is the owner of the book
  if (book.userId !== userId) {
    throw new Error("Forbidden");
  }

  return book;
}


export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getAuthUser();
    const book = await getBookWithOwnership(params.slug, user.id);
    
    const result = await db
      .select()
      .from(chapters)
      .where(eq(chapters.book_id, book.id));

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof Error && error.message === "Book not found" ? 404 :
                 error instanceof Error && error.message === "Forbidden" ? 403 : 500;
    const message = error instanceof Error ? error.message : "Failed to fetch chapters";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getAuthUser();
    const book = await getBookWithOwnership(params.slug, user.id);
    const body = await request.json();
    
    const result = await createChapter({
      ...body, 
      book_id: book.id,
      user
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const status = error instanceof Error && error.message === "Book not found" ? 404 :
                 error instanceof Error && error.message === "Forbidden" ? 403 :
                 error instanceof Error && error.message === "Unauthorized" ? 401 : 400;
    const message = error instanceof Error ? error.message : "Failed to create chapter";
    return NextResponse.json({ error: message }, { status });
  }
}
