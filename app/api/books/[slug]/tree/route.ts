import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import {  eq } from 'drizzle-orm';
import { chapters } from '@/db/schema';
import { getSession } from '@/actions/auth/get-session';

type ChapterWithChildren = {
  id: string;
  title: string;
  content: string;
  order: number;
  level: number;
  parent_chapter_id: string | null;
  children: ChapterWithChildren[];
};

export async function GET(
  request: Request,
  { params }: { params: { bookId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const bookId = params.bookId;
    if (!bookId) {
      return NextResponse.json(
        { error: 'Book ID is required' },
        { status: 400 }
      );
    }

    // Verify the book exists and the user has access to it
    const book = await db.query.books.findFirst({
      where: (books, { eq, and }) => and(
        eq(books.id, bookId),
        eq(books.userId, session.user.id)
      ),
      columns: { id: true }
    });

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch all chapters for the book
    const allChapters = await db.query.chapters.findMany({
      where: eq(chapters.book_id, bookId),
      columns: {
        id: true,
        title: true,
        content: true,
        order: true,
        level: true,
        parent_chapter_id: true,
        created_at: true,
        updated_at: true
      },
      orderBy: (chapters, { asc }) => [asc(chapters.order)]
    });

    // Build the tree structure
    function buildTree(chapters: typeof allChapters, parentId: string | null = null): ChapterWithChildren[] {
      const result: ChapterWithChildren[] = [];
      
      // Filter chapters by parent ID
      const children = chapters.filter(chapter => 
        (chapter.parent_chapter_id === parentId) || 
        (!chapter.parent_chapter_id && !parentId)
      );
      
      // Sort by order
      children.sort((a, b) => a.order - b.order);
      
      // Build the tree recursively
      for (const chapter of children) {
        const node: ChapterWithChildren = {
          id: chapter.id,
          title: chapter.title,
          content: chapter.content,
          order: chapter.order,
          level: chapter.level,
          parent_chapter_id: chapter.parent_chapter_id,
          children: buildTree(chapters, chapter.id)
        };
        result.push(node);
      }
      
      return result;
    }

    const tree = buildTree(allChapters);

    return NextResponse.json({
      success: true,
      data: tree
    });

  } catch (error) {
    console.error('Error fetching chapter tree:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch chapter tree',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
