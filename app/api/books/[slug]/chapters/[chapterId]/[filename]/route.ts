// app/api/books/[slug]/chapters/[chapterId]/[filename]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withApiAuth } from "@/lib/with-auth";
import { getBookBySlug } from "@/actions/books/get-book-by-slug";
import { generateChapterHtml } from "@/lib/generate-chapter-html";
import { db } from "@/db/drizzle";
import { chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ChapterWithChildren } from "@/types/chapter";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string; chapterId: string; filename: string } }
) {
  return withApiAuth(request, async (user) => {
    try {
      const { slug, chapterId, filename } = params;
      
      // Validate input
      if (!slug || !chapterId) {
        return NextResponse.json(
          { error: "Slug and chapter ID are required" },
          { status: 400 }
        );
      }

      // Get the chapter with children and book info to get the user ID
      const chapterWithBook = await db.query.chapters.findFirst({
        where: eq(chapters.id, chapterId),
        with: {
          book: {
            columns: {
              userId: true
            }
          },
          children_chapters: {
            orderBy: (chapters, { asc }) => [asc(chapters.order)],
            columns: {
              id: true,
              title: true,
              content: true,
              order: true,
              level: true,
              parent_chapter_id: true,
              book_id: true,
              created_at: true,
              updated_at: true
            }
          },
          parent_chapter: {
            columns: {
              id: true,
              title: true,
              content: true,
              order: true,
              level: true,
              parent_chapter_id: true,
              book_id: true,
              created_at: true,
              updated_at: true
            }
          }
        },
        columns: {
          id: true,
          title: true,
          content: true,
          order: true,
          level: true,
          parent_chapter_id: true,
          book_id: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!chapterWithBook || chapterWithBook.book.userId !== user.id) {
        return NextResponse.json(
          { error: "Chapter not found or access denied" },
          { status: 404 }
        );
      }

      // Define a type for the chapter data we get from the database
      type DBChapter = {
        id: string;
        title: string;
        content: string;
        order: number;
        level: number;
        parent_chapter_id: string | null;
        book_id: string;
        user_id?: string;
        created_at?: string;
        updated_at?: string;
        children_chapters?: DBChapter[];
        parent_chapter?: DBChapter | null;
      };

      // Helper function to transform a chapter to match the ChapterWithChildren type
      const transformChapter = (ch: DBChapter): ChapterWithChildren => {
        const transformed: ChapterWithChildren = {
          ...ch,
          user_id: ch.user_id || chapterWithBook.book.userId,
          userId: ch.user_id || chapterWithBook.book.userId,
          parent_chapter_id: ch.parent_chapter_id || null,
          children_chapters: ch.children_chapters?.map(transformChapter) || [],
          createdAt: ch.created_at || new Date().toISOString(),
          updatedAt: ch.updated_at || new Date().toISOString()
        };

        // Handle parent chapter transformation separately to avoid circular reference
        if (ch.parent_chapter) {
          transformed.parent_chapter = {
            ...ch.parent_chapter,
            user_id: ch.parent_chapter.user_id || chapterWithBook.book.userId,
            userId: ch.parent_chapter.user_id || chapterWithBook.book.userId,
            parent_chapter_id: ch.parent_chapter.parent_chapter_id || null,
            children_chapters: [], // We don't need to include nested children for the parent
            createdAt: ch.parent_chapter.created_at || new Date().toISOString(),
            updatedAt: ch.parent_chapter.updated_at || new Date().toISOString()
          };
        } else {
          transformed.parent_chapter = null;
        }

        return transformed;
      };

      // Transform the main chapter
      const chapter = transformChapter({
        ...chapterWithBook,
        user_id: chapterWithBook.book.userId,
        userId: chapterWithBook.book.userId,
        children_chapters: chapterWithBook.children_chapters || []
      });

      if (!chapter) {
        return NextResponse.json(
          { error: "Chapter not found" },
          { status: 404 }
        );
      }

      // Get book info
      const book = await getBookBySlug(slug);
      if (!book) {
        return NextResponse.json(
          { error: "Book not found" },
          { status: 404 }
        );
      }

      // Verify the filename matches the expected format
      const expectedFilename = `${chapterId}-${String(chapter.order || 0).padStart(3, '0')}.html`;
      if (filename !== expectedFilename) {
        return NextResponse.redirect(
          new URL(`/api/books/${slug}/chapters/${chapterId}/${expectedFilename}`, request.url)
        );
      }

      // Generate HTML
      const html = generateChapterHtml({
        chapter,
        bookTitle: book.title,
        bookSlug: slug,
        baseImageUrl: process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL ? 
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/books` : 
          '/api/books'
      });

      // Return as HTML
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600'
        },
      });

    } catch (error) {
      console.error('Error generating chapter HTML:', error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  });
}