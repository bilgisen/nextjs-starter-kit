import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';

import { books } from '@/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

type DBBook = InferSelectModel<typeof books>;

// Helper to check GitHub Actions authentication
function checkGitHubAuth(request: Request) {
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${process.env.GITHUB_ACTIONS_SECRET}`;
}


// Define the book type for the imprint
interface ImprintBook extends Omit<DBBook, 'created_at' | 'updated_at'> {
  // Add any additional fields needed for the imprint
  authors?: string[];
  publishedDate?: string;
  // Backward compatibility with snake_case fields
  created_at?: string;
  updated_at?: string;
}

// Helper function to generate the imprint HTML
function generateImprint(book: ImprintBook) {
  if (!book) return '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Imprint - ${book.title}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }
      h1 {
        color: #111;
        border-bottom: 1px solid #eee;
        padding-bottom: 0.5rem;
      }
      .imprint-section {
        margin-bottom: 2rem;
      }
      .label {
        font-weight: 600;
        display: inline-block;
        min-width: 120px;
      }
      .authors {
        font-style: italic;
        color: #555;
      }
    </style>
  </head>
  <body>
    <h1>Imprint</h1>
    
    <div class="imprint-section">
      <h2>Book Information</h2>
      <p><span class="label">Title:</span> ${book.title}</p>
      <p class="authors">
        <span class="label">Author(s):</span> 
        ${book.authors?.join(', ') || 'Not specified'}
      </p>
      <p><span class="label">Publisher:</span> ${book.publisher || 'Not specified'}</p>
      <p><span class="label">Publication Date:</span> ${book.publishedDate || 'Not specified'}</p>
      <p><span class="label">ISBN:</span> ${book.isbn || 'Not specified'}</p>
    </div>

    <div class="imprint-section">
      <h2>Copyright Information</h2>
      <p>
        <span class="label">Copyright:</span>
        ${new Date().getFullYear()} ${book.publisher || 'The Author(s)'}. All rights reserved.
      </p>
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
    // Check for GitHub Actions authentication
    if (process.env.NODE_ENV === 'production' && !checkGitHubAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the book from the database
    const book = await db.query.books.findFirst({
      where: (books, { eq }) => eq(books.slug, params.slug),
    }) as ImprintBook | undefined;

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    // Generate the imprint HTML
    const htmlContent = generateImprint({
      ...book,
      authors: book.author ? [book.author] : [],
      publishedDate: book.publish_year?.toString()
    });

    // Return the HTML response directly
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
