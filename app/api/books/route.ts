import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { getSession } from "@/actions/auth/get-session";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Query only the books belonging to the authenticated user
    const userBooks = await db
      .select({
        id: books.id,
        slug: books.slug,  // Include the slug field
        title: books.title,
        author: books.author,
        publisher: books.publisher,
        cover_image_url: books.cover_image_url,
      })
      .from(books)
      .where(eq(books.userId, session.user.id));

    return NextResponse.json(userBooks);
  } catch (err) {
    console.error("Error fetching books:", err);
    return NextResponse.json(
      { error: "Failed to fetch books" }, 
      { status: 500 }
    );
  }
}
