'use client';

import { useEffect } from 'react';
import { useGetBook } from '@/queries/books/get-book';
import { useGetChapters } from '@/queries/books/chapters/get-chapters';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

interface BookPreviewProps {
  onPreviewReady?: (html: string) => void;
}

export function BookPreview({ onPreviewReady }: BookPreviewProps) {
  const params = useParams();
  const bookSlug = typeof params?.slug === 'string' ? params.slug : '';
  
  // Fetch book data
  const { data: book, isLoading: isLoadingBook } = useGetBook(bookSlug, { bySlug: true });
  
  // Fetch chapters for the book
  const { data: chapters = [], isLoading: isLoadingChapters } = useGetChapters(book?.id || '', {
    enabled: !!book?.id,
  });

  // Generate HTML preview when data is loaded
  useEffect(() => {
    if (book && chapters.length > 0 && onPreviewReady) {
      const previewHtml = generatePreviewHtml(book, chapters);
      onPreviewReady(previewHtml);
    }
  }, [book, chapters, onPreviewReady]);

  if (isLoadingBook || isLoadingChapters) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading preview...</span>
      </div>
    );
  }

  if (!book || chapters.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No content available for preview. Please add chapters to your book.
      </div>
    );
  }

  return null; // This component doesn't render anything visible
}

interface BookPreviewType {
  title?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  description?: string;
  language?: string;
}

interface ChapterPreviewType {
  title: string;
  content: string;
  order: number;
}

// Helper function to generate HTML preview
function generatePreviewHtml(book: BookPreviewType, chapters: ChapterPreviewType[]) {
  // Sort chapters by order
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  
  // Generate chapter HTML
  const chaptersHtml = sortedChapters
    .map((chapter, index) => {
      return `
<h2 id="chapter-${index + 1}">${chapter.title}</h2>
<div class="chapter-content">
  ${chapter.content}
</div>`;
    })
    .join('\n\n');

  // Generate complete HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${book.title || 'Untitled Book'}</title>
  <meta name="author" content="${book.author || 'Unknown Author'}">
  <meta name="language" content="en">
  <meta name="publisher" content="${book.publisher || 'Self-published'}">
  ${book.isbn ? `<meta name="isbn" content="${book.isbn}">` : ''}
  ${book.description ? `<meta name="description" content="${book.description}">` : ''}
  <meta name="date" content="${new Date().toISOString().split('T')[0]}">
  <style>
    body {
      font-family: Georgia, serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
      margin-top: 1.5em;
    }
    .chapter-content {
      margin-bottom: 2em;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 1.5em 0;
      padding: 0.5em 1em;
      color: #555;
    }
    img {
      max-width: 100%;
      height: auto;
    }
  </style>
</head>
<body>
  <h1>${book.title || 'Untitled Book'}</h1>
  ${book.subtitle ? `<h2>${book.subtitle}</h2>` : ''}
  ${book.author ? `<h3>By ${book.author}</h3>` : ''}
  ${book.description ? `<p><em>${book.description}</em></p>` : ''}

  <hr>

  ${chaptersHtml}
</body>
</html>`;
}
