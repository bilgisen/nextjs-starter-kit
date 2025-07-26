import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { books } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/actions/auth/get-session';
import { getChaptersByBook } from '@/actions/books/get-chapters-by-book';

interface Chapter {
  id: string;
  title: string;
  order?: number;
  level?: number;
  parent_chapter_id: string | null;
}

interface Book {
  id: string;
  slug: string;
  title: string;
  language?: string;
  cover_image_url?: string | null;
  coverImageUrl?: string | null;
}

type Context = {
  params: {
    slug: string;
  };
};

// Helper to check GitHub Actions authentication
function checkGitHubAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.NEXT_EPUB_SECRET}`;
}

export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    const { slug } = await Promise.resolve(params);
    
    if (!slug) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Book slug is required' 
        },
        { status: 400 }
      );
    }

    // Check for GitHub Actions authentication
    const isGitHubAction = checkGitHubAuth(request);
    
    // For regular users, check session
    if (!isGitHubAction) {
      const session = await getSession();
      const userId = session?.user?.id;

      if (!userId) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Unauthorized - Please sign in' 
          },
          { status: 401 }
        );
      }
      
      // Verify book ownership for regular users
      const [book] = await db
        .select()
        .from(books)
        .where(and(
          eq(books.slug, slug),
          eq(books.userId, userId)
        ));

      if (!book) {
        return new NextResponse('Book not found', { status: 404 });
      }
      
      return await generatePayload(book);
    }
    
    // For GitHub Actions, bypass ownership check but still validate the book exists
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.slug, slug));
      
    if (!book) {
      return new NextResponse('Book not found', { status: 404 });
    }
    
    return await generatePayload(book);

  } catch (error) {
    console.error('Error generating payload.json:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate payload',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate the payload
async function generatePayload(book: Book) {
  try {
    const chapters = await getChaptersByBook(book.id);
    
    // Build chapter payload
    const chapterPayload = chapters.map((chapter: Chapter, index: number) => {
      const headingLevel = Math.min(1 + (chapter.level ?? 1), 6);
      
      return {
        id: chapter.id,
        title: chapter.title,
        order: chapter.order ?? index,
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/books/${book.slug}/chapters/${chapter.id}/${chapter.id}-${String(index).padStart(3, '0')}.html`,
        parent: chapter.parent_chapter_id ?? null,
        level: chapter.level ?? 0,
        title_tag: `h${headingLevel}`
      };
    });

    const payload = {
      book: {
        slug: book.slug,
        title: book.title,
        language: book.language || 'tr',
        cover_url: book.cover_image_url || null,
        stylesheet_url: `${process.env.NEXT_PUBLIC_BASE_URL}/styles/epub.css`,
        imprint: {
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/books/${book.slug}/imprint.html`,
        },
        chapters: chapterPayload,
      },
      options: {
        generate_toc: true,
        include_imprint: true,
        output_format: 'epub',
        embed_metadata: true,
        cover: !!(book.cover_image_url || book.coverImageUrl),
      },
    };

    // Return JSON response that will be displayed in browser
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in generatePayload:', error);
    throw error; // This will be caught by the outer try-catch
  }
}

// This prevents Next.js from complaining about missing dynamic parameters
export const dynamic = 'force-dynamic';
