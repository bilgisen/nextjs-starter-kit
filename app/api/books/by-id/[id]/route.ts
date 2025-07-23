import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isUUID } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params is resolved
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    
    if (!id) {
      return NextResponse.json(
        { error: "Book ID or slug is required" },
        { status: 400 }
      );
    }

    // Check if the ID is a valid UUID
    const isUuid = isUUID(id);
    
    const [book] = await db
      .select()
      .from(books)
      .where(
        isUuid 
          ? eq(books.id, id)
          : eq(books.slug, id)
      )
      .limit(1);
      
    if (!book) {
      return NextResponse.json(
        { error: "Book not found" }, 
        { status: 404 }
      );
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error fetching book by ID or slug:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch book",
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
