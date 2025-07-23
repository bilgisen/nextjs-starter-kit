import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/with-auth";
import { getChapter } from "@/actions/books/chapters/get-chapter";
import { updateChapter } from "@/actions/books/chapters/update-chapter";
import { deleteChapter } from "@/actions/books/chapters/delete-chapter";
import { db } from "@/db/drizzle";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";


export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; chapterId: string } }
) {
  return withApiAuth(request, async (user) => {
    try {
      // Get and validate parameters
      const { slug, chapterId } = await Promise.resolve(params);
      
      // Validate input
      if (!slug || !chapterId) {
        return NextResponse.json(
          { error: "Book slug and chapter ID are required" },
          { status: 400 }
        );
      }
      
      // Get the book by slug to verify ownership
      const [book] = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.slug, slug))
        .limit(1);
        
      if (!book) {
        return NextResponse.json(
          { error: "Book not found" }, 
          { status: 404 }
        );
      }
      
      // Get the chapter with ownership check
      const chapter = await getChapter({ 
        id: chapterId, 
        bookId: book.id, 
        userId: user.id 
      });
      
      return NextResponse.json(chapter);
      
    } catch (error) {
      console.error("Error in GET /api/books/[slug]/chapters/[chapterId]:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Internal server error" },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string; chapterId: string } }
) {
  return withApiAuth(request, async (user) => {
    try {
      // Get and validate parameters
      const { slug, chapterId } = await Promise.resolve(params);
      
      // Validate input
      if (!slug || !chapterId) {
        return NextResponse.json(
          { error: "Book slug and chapter ID are required" },
          { status: 400 }
        );
      }
      
      // Get the book by slug to verify ownership
      const [book] = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.slug, slug))
        .limit(1);
        
      if (!book) {
        return NextResponse.json(
          { error: "Book not found" }, 
          { status: 404 }
        );
      }
      
      // Parse and validate request body
      const updateData = await request.json();
      
      // Update the chapter with ownership check
      const updatedChapter = await updateChapter({ 
        ...updateData,
        id: chapterId,
        bookId: book.id,
        userId: user.id
      });
      
      return NextResponse.json(updatedChapter);
      
    } catch (error) {
      console.error("Error in PUT /api/books/[slug]/chapters/[chapterId]:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to update chapter" },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string; chapterId: string } }
) {
  return withApiAuth(request, async (user) => {
    try {
      // Get and validate parameters
      const { slug, chapterId } = await Promise.resolve(params);
      
      if (!slug || !chapterId) {
        return NextResponse.json(
          { error: "Book slug and chapter ID are required" },
          { status: 400 }
        );
      }
      
      // Get the book by slug to verify ownership
      const [book] = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.slug, slug))
        .limit(1);
        
      if (!book) {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }
      
      // Delete the chapter
      await deleteChapter({
        id: chapterId,
        bookId: book.id,
        userId: user.id
      });
      
      return NextResponse.json({ success: true });
      
    } catch (error) {
      console.error("Error in DELETE /api/books/[slug]/chapters/[chapterId]:", error);
      return NextResponse.json(
        { 
          error: error instanceof Error 
            ? error.message 
            : "An unexpected error occurred while deleting the chapter" 
        },
        { status: 500 }
      );
    }
  });
}
