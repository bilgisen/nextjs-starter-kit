import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { books } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/actions/auth/get-session';

// Helper to check GitHub Actions authentication
function checkGitHubAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.GITHUB_ACTIONS_SECRET}`;
}

// Define the book type for the imprint
interface ImprintBook {
  id: string;
  userId: string;
  title: string;
  slug: string;
  author: string | null;
  publisher: string | null;
  description?: string | null;
  isbn?: string | null;
  publish_year?: number | null;
  language?: string | null;
  cover_image_url?: string | null;
  created_at: string;
  updated_at: string;
  // Backward compatibility
  user_id?: string;
}

// Helper function to generate the imprint HTML
function generateImprint(book: ImprintBook) {
  if (!book) return '';

  // Format the current date as YYYY-MM-DD
  const currentDate = new Date().toISOString().split('T')[0];
  const formattedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="type" content="imprint" />
    <meta name="book" content="${book.slug}" />
    <meta name="language" content="${book.language || 'en'}" />
    <meta name="date" content="${currentDate}" />
    <meta name="publisher" content="${book.publisher || 'Self-published'}" />
    <meta name="isbn" content="${book.isbn || ''}" />
    <title>Imprint | ${book.title}</title>
    <style>
      body {
        font-family: serif;
        font-size: 1rem;
        line-height: 1.6;
        margin: 3em;
        text-align: justify;
      }
      h2 {
        text-align: center;
        font-size: 1.5rem;
        margin-bottom: 2em;
      }
      .section {
        margin-bottom: 2em;
      }
      .label {
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <h2>Imprint</h2>
    <div class="section">
      <p><span class="label">Title:</span> ${book.title}</p>
      <p><span class="label">Author:</span> ${book.author || 'Unknown'}</p>
      <p>
        <span class="label">Publisher:</span>
        ${book.publisher || 'Self-published'}, ${book.publish_year || new Date().getFullYear()}
      </p>
      ${book.isbn ? `<p><span class="label">ISBN:</span>${book.isbn}</p>` : ''}
      <p><span class="label">Published Date:</span> ${formattedDate}</p>
    </div>
    <div class="section">
      <p>
        <span class="label">License:</span>
        Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)
      </p>
    </div>
  </body>
</html>`;
}

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
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
      
      const htmlContent = generateImprint(book);
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    
    // For GitHub Actions, bypass ownership check but still validate the book exists
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.slug, slug));
      
    if (!book) {
      return new NextResponse('Book not found', { status: 404 });
    }
    
    const htmlContent = generateImprint(book);
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating imprint:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
