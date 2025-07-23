'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { withServerAuth } from '@/lib/server-auth';
import { db } from '@/db/drizzle';
import { processChaptersContent } from '@/lib/tiptap/processContent';

const execAsync = promisify(exec);

interface PreviewBookParams {
  book: {
    id: string;
    title: string;
    author: string;
    language: string;
    coverImage?: string;
  };
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }>;
  options: {
    format: string;
    includeToc: boolean;
    theme: string;
    [key: string]: string | boolean | number | undefined;
  };
}

export const previewBook = withServerAuth(async (user, { book, chapters, options }: PreviewBookParams) => {
  try {
    // Verify user has access to this book
    const userBook = await db.query.books.findFirst({
      where: (books, { and, eq }) => and(
        eq(books.id, book.id),
        eq(books.user_id, user.id)
      ),
    });

    if (!userBook) {
      throw new Error('Book not found or access denied');
    }

    // Create a temporary directory for this preview
    const tempDir = `/tmp/pandoc-preview-${uuidv4()}`;
    await fs.mkdir(tempDir, { recursive: true });

    // Process TipTap content and sort chapters
    const processedChapters = processChaptersContent(chapters);
    
    if (processedChapters.length === 0 || processedChapters.every(c => !c.content.trim())) {
      throw new Error('No valid content to preview');
    }
    
    // Write each chapter to a separate markdown file
    const inputFiles: string[] = [];
    
    for (const [index, chapter] of processedChapters.entries()) {
      const chapterFilename = `chapter-${String(index + 1).padStart(3, '0')}.md`;
      const filePath = path.join(tempDir, chapterFilename);
      
      // Add chapter title as a markdown heading
      const content = `# ${chapter.title}\n\n${chapter.content}`;
      
      await fs.writeFile(filePath, content, 'utf-8');
      inputFiles.push(filePath);
    }

    // Build and execute Pandoc command to generate HTML preview
    const outputPath = path.join(tempDir, 'preview.html');
    const cssPath = path.join(process.cwd(), 'public', 'styles', `${options.theme || 'default'}.css`);
    
    const cmd = [
      'pandoc',
      ...inputFiles,
      '--standalone',
      '--self-contained',
      `--css=${cssPath}`,
      `--metadata title="${book.title || 'Untitled Book'}"`,
      `--metadata author="${book.author || 'Unknown Author'}"`,
      `--metadata lang="${book.language || 'en'}"`,
      options.includeToc ? '--toc --toc-depth=2' : '',
      `-o "${outputPath}"`
    ].filter(Boolean).join(' ');

    // Execute Pandoc to generate HTML
    console.log('Executing Pandoc command:', cmd);
    
    try {
      const { stderr } = await execAsync(cmd);
      
      if (stderr) {
        console.warn('Pandoc stderr:', stderr);
      }
      
      // Read the generated HTML
      const html = await fs.readFile(outputPath, 'utf-8');
      
      // Clean up temporary files
      await fs.rm(tempDir, { recursive: true, force: true });
      
      // Return the generated HTML
      // Note: The HTML already includes styles from the theme CSS
      return html;
    } catch (error) {
      console.error('Error generating preview:', error);
      // Clean up temporary files in case of error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw new Error(
        error instanceof Error ? error.message : 'Failed to generate preview'
      );
    }
  } catch (error) {
    console.error('Preview error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to generate preview'
    );
  }
});
