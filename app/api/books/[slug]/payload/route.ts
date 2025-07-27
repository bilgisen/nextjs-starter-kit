import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { books, chapters } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { getSession } from '@/actions/auth/get-session';
import { getChaptersByBook } from '@/actions/books/get-chapters-by-book';
import { format } from 'date-fns';
import { Book, Chapter } from '@/types/book';

interface ChapterWithContent extends Chapter {
  content: string;
  html_content?: string;
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
    const outputFormat = getOutputFormat(request);
    
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
      
      return await generatePayload(book, outputFormat);
    }
    
    // For GitHub Actions, bypass ownership check but still validate the book exists
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.slug, slug));
      
    if (!book) {
      return new NextResponse('Book not found', { status: 404 });
    }
    
    return await generatePayload(book, outputFormat);

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
function generateChapterHTML(chapter: ChapterWithContent, book: Book): string {
  const headingLevel = Math.min(1 + (chapter.level ?? 1), 6);
  const titleTag = `h${headingLevel}`;
  
  return `
    <section id="chapter-${chapter.id}" class="chapter" data-level="${chapter.level || 1}">
      <${titleTag} class="chapter-title">${chapter.title}</${titleTag}>
      <div class="chapter-content">
        ${chapter.html_content || chapter.content}
      </div>
    </section>
  `;
}

// Helper function to generate the full HTML document
function generateFullHTML(book: Book, chapters: ChapterWithContent[]): string {
  const title = book.title || 'Untitled Book';
  const language = book.language || 'en';
  const coverImage = book.cover_image_url || '';
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  
  const chapterHTML = chapters
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(chapter => generateChapterHTML(chapter, book))
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
async function generatePayload(book: Book, format: 'json' | 'html' | 'markdown' = 'json') {
  try {
    // Get chapters with content
    const dbChapters = await db
      .select()
      .from(chapters)
      .where(eq(chapters.bookId, book.id))
      .orderBy(asc(chapters.order));
    
    // Transform chapters to include content
    const chaptersWithContent: ChapterWithContent[] = dbChapters.map(chapter => ({
      ...chapter,
      content: chapter.content || '',
      html_content: chapter.html_content || ''
    }));
    
    // Generate metadata
    const metadata = {
      title: book.title,
      language: book.language || 'tr',
      creator: book.author || 'Unknown Author',
      publisher: 'Turna',
      date: format(new Date(), 'yyyy-MM-dd'),
      identifier: book.slug,
      cover: book.cover_image_url || null,
    };

    // Generate the payload based on format
    switch (format) {
      case 'html': {
        const htmlContent = generateFullHTML(book, chaptersWithContent);
        return new NextResponse(htmlContent, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
      
      case 'markdown': {
        // Convert HTML to Markdown (simplified for brevity)
        let markdown = `# ${book.title}\n\n`;
        markdown += `**Author:** ${book.author || 'Unknown'}\n\n`;
        markdown += `**Language:** ${book.language || 'tr'}\n\n`;
        
        // Add chapters
        chaptersWithContent.forEach(chapter => {
          const heading = '#'.repeat(Math.min(2, (chapter.level || 1) + 1));
          markdown += `\n${heading} ${chapter.title}\n\n`;
          markdown += `${chapter.content}\n\n`;
        });
        
        return new NextResponse(markdown, {
          headers: { 'Content-Type': 'text/markdown' },
        });
      }
      
      case 'json':
      default: {
        const payload = {
          metadata,
          chapters: chaptersWithContent.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            content: chapter.content,
            html_content: chapter.html_content,
            order: chapter.order,
            level: chapter.level,
            parent_chapter_id: chapter.parent_chapter_id,
          })),
          options: {
            generate_toc: true,
            include_imprint: true,
            output_format: 'epub',
            embed_metadata: true,
            cover: !!(book.cover_image_url || book.coverImageUrl),
          },
        };
        
        return new NextResponse(JSON.stringify(payload, null, 2), {
          headers: { 'Content-Type': 'application/json' },
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
