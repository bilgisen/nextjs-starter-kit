import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/with-auth";
import { createChapter } from "@/actions/books/chapters/create-chapter";
import { db } from "@/db/drizzle";
import { getBookWithOwnership } from "@/lib/books";
import { chapters } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

// Response type
type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
  success: boolean;
};

// Schema
const createChapterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  order: z.number().int().min(0),
  parentId: z.string().uuid().optional().nullable(),
  level: z.number().int().min(0).default(0),
});

// ✅ GET handler
export const GET = async (
  request: NextRequest,
  { params }: { params: { slug: string } }
) => {
  // Ensure params is properly destructured and awaited
  const { slug } = await Promise.resolve(params);

  try {
    const identifier = slug;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

    console.log(`[GET /api/books/${identifier}/chapters] Fetching chapters for book (${isUuid ? 'ID' : 'slug'}):`, identifier);

    const user = await withApiAuth(request, async (user) => user);

    let book;
    if (isUuid) {
      book = await db.query.books.findFirst({
        where: (books, { eq }) => eq(books.id, identifier),
      });
    }

    if (!book) {
      book = await getBookWithOwnership(identifier, user.id);
    }

    if (!book) {
      console.error(`[GET /api/books/${identifier}/chapters] Book not found or access denied`);
      return NextResponse.json(
        { error: "Book not found", success: false },
        { status: 404 }
      );
    }

    console.log(`[GET /api/books/${identifier}/chapters] Found book ID:`, book.id);

    const bookChapters = await db
      .select({
        id: chapters.id,
        book_id: chapters.book_id,
        parent_chapter_id: chapters.parent_chapter_id,
        title: chapters.title,
        content: chapters.content,
        order: chapters.order,
        level: chapters.level,
        created_at: chapters.created_at,
        updated_at: chapters.updated_at,
      })
      .from(chapters)
      .where(eq(chapters.book_id, book.id))
      .orderBy(asc(chapters.order));

    console.log(`[GET /api/books/${identifier}/chapters] Found ${bookChapters.length} chapters`);

    return NextResponse.json({
      success: true,
      data: bookChapters,
    });
  } catch (error) {
    console.error('[GET /api/books/[identifier]/chapters] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch chapters',
        success: false,
      },
      { status: 500 }
    );
  }
};

// ✅ POST handler
export const POST = async (
  request: NextRequest,
  { params }: { params: { slug: string } }
) => {
  // Ensure params is properly destructured and awaited
  const { slug } = await Promise.resolve(params);

  return withApiAuth(request, async (user) => {
    try {
      const identifier = slug;

      const body = await request.json();
      const validation = createChapterSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Invalid input data",
            details: validation.error.format(),
            success: false,
          } as ApiResponse,
          { status: 400 }
        );
      }

      const book = await getBookWithOwnership(identifier, user.id);
      if (!book) {
        return NextResponse.json(
          { error: "Book not found", success: false } as ApiResponse,
          { status: 404 }
        );
      }

      const newChapter = await createChapter({
        ...validation.data,
        bookId: book.id,
        userId: user.id,
      });

      return NextResponse.json(
        { data: newChapter, success: true } as ApiResponse<typeof newChapter>,
        { status: 201 }
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error("[CHAPTERS_POST_ERROR]", error);

      const status =
        errorMessage === "Book not found" ? 404 :
        errorMessage.includes("permission") ? 403 : 500;

      return NextResponse.json(
        { error: errorMessage, success: false } as ApiResponse,
        { status }
      );
    }
  });
};
