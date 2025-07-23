import { NextRequest, NextResponse } from "next/server";
import { getBookBySlug } from "@/actions/books/get-book-by-slug";

type Context = {
  params: {
    slug: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  try {
    // Ensure params is properly destructured and awaited
    const { slug } = await Promise.resolve(params);
    
    if (!slug) {
      return NextResponse.json(
        { 
          success: false,
          error: "Book slug is required" 
        },
        { status: 400 }
      );
    }

    // Get the book by slug
    const book = await getBookBySlug(slug);
    
    if (!book) {
      return NextResponse.json(
        { 
          success: false,
          error: "Book not found" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: book 
    });
    
  } catch (error) {
    console.error("Error in GET /api/books/[slug]:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error 
          ? error.message 
          : "An unexpected error occurred while fetching the book"
      },
      { status: 500 }
    );
  }
}
