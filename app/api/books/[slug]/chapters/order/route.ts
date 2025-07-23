import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { chapters } from '@/db/schema';
import { z } from 'zod';
import { getSession } from '@/actions/auth/get-session';

// Validation schema for the request body
const UpdateChaptersOrderSchema = z.object({
  chapters: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().nonnegative(),
      level: z.number().int().min(0).max(5), // Limit to 5 levels deep
      parent_chapter_id: z.string().uuid().nullable(),
    })
  ),
});

// Function to validate the chapter hierarchy
function validateChapterHierarchy(chapters: { id: string; parent_chapter_id: string | null }[]): { valid: boolean; error?: string } {
  // Check for cycles and invalid parent references
  const chapterMap = new Map(chapters.map(ch => [ch.id, ch]));
  
  for (const chapter of chapters) {
    let currentId = chapter.parent_chapter_id;
    const visited = new Set<string>([chapter.id]); // Track visited to detect cycles
    
    while (currentId) {
      if (visited.has(currentId)) {
        return { 
          valid: false, 
          error: `Circular reference detected in chapter hierarchy (${[...visited].join(' -> ')} -> ${currentId})` 
        };
      }
      
      visited.add(currentId);
      const parent = chapterMap.get(currentId);
      
      if (!parent) {
        return { 
          valid: false, 
          error: `Parent chapter ${currentId} not found for chapter ${chapter.id}` 
        };
      }
      
      currentId = parent.parent_chapter_id;
    }
  }
  
  return { valid: true };
}

export async function PUT(
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

    console.log('Verifying book access:', { bookId, userId: session.user.id });
    
    // First verify the book exists and get its user_id
    const book = await db.query.books.findFirst({
      where: (books, { eq }) => eq(books.id, bookId),
      columns: { id: true, userId: true, title: true }
    });

    console.log('Book query result:', book);

    if (!book) {
      console.error('Book not found:', { bookId });
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Check if the current user owns the book
    if (book.userId !== session.user.id) {
      console.error('Access denied:', { 
        bookUserId: book.userId, 
        currentUserId: session.user.id 
      });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const result = UpdateChaptersOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: result.error.issues },
        { status: 400 }
      );
    }

    const { chapters: chaptersToUpdate } = result.data;
    
    // Validate the hierarchy
    const hierarchyValidation = validateChapterHierarchy(chaptersToUpdate);
    if (!hierarchyValidation.valid) {
      return NextResponse.json(
        { error: 'Invalid chapter hierarchy', details: hierarchyValidation.error },
        { status: 400 }
      );
    }

    // Verify all chapters belong to this book
    const chapterIds = chaptersToUpdate.map(ch => ch.id);
    
    const existingChapters = await db.query.chapters.findMany({
      where: (chapters, { and, eq, inArray }) => 
        and(
          eq(chapters.book_id, bookId),
          inArray(chapters.id, chapterIds)
        ),
      columns: {
        id: true
      }
    });

    if (existingChapters.length !== chapterIds.length) {
      return NextResponse.json(
        { error: 'One or more chapters not found' },
        { status: 404 }
      );
    }

    try {
      // Update all chapters in a single transaction
      await db.transaction(async (tx) => {
        // First, update all chapters with their new parent and level
        for (const chapter of chaptersToUpdate) {
          await tx.update(chapters)
            .set({
              order: chapter.order,
              parent_chapter_id: chapter.parent_chapter_id || null,
              level: chapter.level,
              updated_at: new Date().toISOString(),
            })
            .where(eq(chapters.id, chapter.id));
        }
        
        // Then update the order of all chapters to ensure consistency
        // This helps with cases where the order might have changed
        await Promise.all(
          chaptersToUpdate.map(chapter => 
            tx.update(chapters)
              .set({ order: chapter.order })
              .where(eq(chapters.id, chapter.id))
          )
        );
      });
      
      // Revalidate the chapters page
      revalidatePath(`/dashboard/books/${bookId}/chapters`);
      
      return NextResponse.json({ 
        success: true,
        message: 'Chapter order updated successfully' 
      });
      
    } catch (dbError) {
      console.error('Database error updating chapter order:', dbError);
      return NextResponse.json(
        { error: 'Failed to update chapter order' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in chapter order update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
