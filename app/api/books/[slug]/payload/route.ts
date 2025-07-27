import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { books, chapters } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getSession } from '@/actions/auth/get-session';

import { format as formatDate } from 'date-fns';
// Define the Book type with all required properties
interface Book {
  id: string;
  title: string;
  slug: string;
  author?: string | null;
  language?: string | null;
  cover_image_url?: string | null;
  coverImageUrl?: string | null;
  userId?: string | null;
  [key: string]: unknown; // For any additional properties
}


// Define our extended chapter type with all required fields
interface ChapterWithContent {
  id: string;
  book_id: string;
  user_id: string;
  title: string;
  content: string;
  html_content: string;
  parent_chapter_id: string | null;
  order: number;
  level: number;
  created_at: string;
  updated_at: string;
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

// Helper to get output format from query params or default to 'json'
function getOutputFormat(request: Request): 'json' | 'html' | 'markdown' {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';
  return format === 'html' || format === 'markdown' ? format : 'json';
}

export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    const { slug } = await Promise.resolve(params);
    const format = getOutputFormat(request);
    
    if (!slug) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Book slug is required' 
        },
        { status: 400 }
      );
    }
    
    // Ensure format is one of the allowed values
    const outputFormat: PayloadFormat = (format === 'html' || format === 'markdown') ? format : 'json';

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
      
      const payload = await generatePayload(book, outputFormat);
      return payload;
    }
    
    // For GitHub Actions, bypass ownership check but still validate the book exists
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.slug, slug));
      
    if (!book) {
      return new NextResponse('Book not found', { status: 404 });
    }
    
    const payload = await generatePayload(book, outputFormat);
    return payload;

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

// Helper function to generate chapter HTML
function generateChapterHTML(chapter: ChapterWithContent): string {
  const headingLevel = Math.min(1 + (chapter.level ?? 1), 6);
  const titleTag = `h${headingLevel}`;
  
  // Ensure we have valid content to display
  const content = chapter.html_content || chapter.content || '';
  
  return `
    <section id="chapter-${chapter.id}" class="chapter" data-level="${chapter.level || 1}">
      <${titleTag} class="chapter-title">${chapter.title || 'Untitled Chapter'}</${titleTag}>
      <div class="chapter-content">
        ${content}
      </div>
    </section>
  `;
}

// Helper function to generate the full HTML document
function generateFullHTML(book: Book, chapters: ChapterWithContent[]): string {
  const title = book.title || 'Untitled Book';
  const language = book.language || 'en';
  const coverImage = book.cover_image_url || '';
  const currentDate = formatDate(new Date(), 'yyyy-MM-dd');
  
  const chapterHTML = chapters
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(chapter => generateChapterHTML(chapter))
    .join('\n\n');
  
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="/styles/epub.css">
  <meta name="generator" content="Turna EPUB Generator">
  <meta name="date" content="${currentDate}">
</head>
<body>
  <div id="book">
    ${coverImage ? `<img src="${coverImage}" class="cover-image" alt="${title} Cover">` : ''}
    <h1 class="book-title">${title}</h1>
    
    <div id="toc" class="table-of-contents">
      <h2>Contents</h2>
      <nav epub:type="toc" id="toc">
        <ol>
          ${chapters
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(chapter => {
              const indent = chapter.level ? '  '.repeat(chapter.level) : '';
              return `${indent}<li><a href="#chapter-${chapter.id}">${chapter.title}</a></li>`;
            })
            .join('\n')}
        </ol>
      </nav>
    </div>
    
    <div id="content">
      ${chapterHTML}
    </div>
  </div>
</body>
</html>`;
}

// Helper function to generate the payload
type PayloadFormat = 'json' | 'html' | 'markdown';

// Helper function to safely format dates
const safeFormatDate = (date: Date | string | null | undefined, formatStr: string): string => {
  if (!date) return formatDate(new Date(), formatStr);
  const dateObj = date instanceof Date ? date : new Date(date);
  return isNaN(dateObj.getTime()) ? formatDate(new Date(), formatStr) : formatDate(dateObj, formatStr);
};

async function generatePayload(book: Book, format: PayloadFormat = 'json' as const): Promise<NextResponse> {
  try {
    // Get chapters with content
    const dbChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.book_id, book.id))
      .orderBy(asc(chapters.order));
    
    // Transform database chapters to our ChapterWithContent type
    const chaptersWithContent: ChapterWithContent[] = dbChapters.map((chapter) => {
      // Map the database chapter to our ChapterWithContent type
      return {
        id: chapter.id,
        book_id: chapter.book_id,
        user_id: 'unknown', // Not available in the database, using default
        title: chapter.title,
        content: chapter.content,
        html_content: chapter.content, // Using content as html_content since it's not in the schema
        parent_chapter_id: chapter.parent_chapter_id,
        order: chapter.order,
        level: chapter.level,
        created_at: safeFormatDate(chapter.created_at, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''),
        updated_at: safeFormatDate(chapter.updated_at, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
      };
    });
    
    // Generate metadata with proper typing
    const metadata = {
      title: book.title,
      language: book.language || 'tr',
      creator: book.author || 'Unknown Author',
      publisher: 'Turna' as const,
      date: formatDate(new Date(), 'yyyy'),
      identifier: book.slug,
      cover: book.cover_image_url || null,
    } as const;

    // Generate the payload based on format
    switch (format) {
      case 'html': {
        const htmlContent = generateFullHTML(book, chaptersWithContent);
        return new NextResponse(htmlContent, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
      
      case 'markdown': {
        // For markdown, we'll return the raw content of all chapters concatenated
        const markdownContent = chaptersWithContent
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(chapter => {
            const heading = '#'.repeat(Math.min(6, 1 + (chapter.level || 0)));
            return `${heading} ${chapter.title}\n\n${chapter.content || ''}`;
          })
          .join('\n\n---\n\n');
        
        return new NextResponse(markdownContent, {
          headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
        });
      }
      
      case 'json':
      default: {
        const payload = {
          metadata,
          chapters: chaptersWithContent,
          options: {
            generate_toc: true,
            include_imprint: true,
            output_format: 'epub',
            embed_metadata: true,
            cover: !!(book.cover_image_url || book.coverImageUrl),
          },
        };
        
        return NextResponse.json(payload, {
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
    }
  } catch (error) {
    console.error('Error in generatePayload:', error);
    throw error; // This will be caught by the outer try-catch
  }
}

// This prevents Next.js from complaining about missing dynamic parameters
export const dynamic = 'force-dynamic';
