'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { buildPandocCommand } from '@/lib/pandoc/buildPandocCommand';
import { withServerAuth } from '@/lib/server-auth';
import { db } from '@/db/drizzle';
import type { InferSelectModel } from 'drizzle-orm';
import { processChaptersContent } from '@/lib/tiptap/processContent';
import { books } from '@/db/schema';
import type { User } from '@/lib/server-auth';

const execAsync = promisify(exec);

interface PublishBookParams {
  book: InferSelectModel<typeof books>;
  chapters: Array<{
    id: string;
    book_id: string;
    title: string;
    content: unknown;
    order: number;
    created_at?: Date;
    updated_at?: Date;
  }>;
  options: {
    format: 'pdf' | 'epub' | 'mobi';
    includeTitlePage?: boolean;
    includeTableOfContents?: boolean;
    author?: string;
    publisher?: string;
    language?: string;
  };
}

async function publishBookAction(user: User, params: PublishBookParams) {
  const { book, chapters, options } = params;
  
  try {
    // Verify user has access to this book using a direct query
    const bookResult = await db.execute<{ id: string }>(
      'SELECT id FROM books WHERE id = $1 AND user_id = $2 LIMIT 1',
      [book.id, user.id]
    );
    
    if (!bookResult.rows.length) {
      throw new Error('Book not found or access denied');
    }

    // Create a temporary directory for processing
    const tempDir = await fs.mkdtemp('/tmp/publish-');
    const inputFiles: string[] = [];

    // Process all chapters at once with proper content formatting
    const processedChapters = await processChaptersContent(chapters.map(chapter => ({
      id: chapter.id,
      title: chapter.title,
      content: chapter.content,
      order: chapter.order
    })));

    // Sort and write each processed chapter to a file
    for (const chapter of processedChapters) {
      const filePath = path.join(tempDir, `chapter-${String(chapter.order).padStart(3, '0')}.md`);
      // Ensure the content is properly formatted as markdown
      const markdownContent = `# ${chapter.title}\n\n${chapter.content}`.trim();
      await fs.writeFile(filePath, markdownContent, 'utf8');
      inputFiles.push(filePath);
    }

    if (inputFiles.length === 0) {
      throw new Error('No valid content to publish');
    }

    // Create output directory
    const outputDir = path.join(process.cwd(), 'public', 'books');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate a unique filename
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const safeTitle = book.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const outputFile = path.join(outputDir, `${safeTitle}-${timestamp}.${options.format}`);
    
    // Build Pandoc command with proper options
    const command = buildPandocCommand(
      inputFiles,
      outputFile,
      {
        title: book.title,
        author: options.author || 'Unknown Author',
        language: options.language || 'en',
      },
      {
        format: options.format,
        includeToc: options.includeTableOfContents ?? true,
        includeImprint: true,
        splitByChapters: false,
        applyStyles: true,
        theme: 'default',
        publisher: options.publisher,
      }
    );

    // Execute Pandoc command
    try {
      await execAsync(command);
      console.log('Book generated successfully at:', outputFile);
      
      // Return the public URL for the generated file
      const publicUrl = `/books/${path.basename(outputFile)}`;
      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Failed to generate book:', error);
      throw new Error(`Failed to generate book: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true });

    // Return the public URL for the generated file
    const publicUrl = `/books/${path.basename(outputFile)}`;
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error publishing book:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish book',
    };
  }
}

// Wrap with server auth
export const publishBook = withServerAuth(publishBookAction);
