'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { submitEpubBuildRequest } from '@/lib/publish/epub/submitEpubBuildRequest';
import type { EpubGenerationRequest } from '@/types/epub';

/**
 * Submits a request to generate an EPUB file
 */
export default async function generateEpub(
  bookSlug: string,
  options: Partial<EpubGenerationRequest['options']> = {}
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Get book data with default options
  const { default: prepareEpubGeneration } = await import('./prepareEpubGeneration');
  const { bookId, bookSlug: slug, chapters, metadata, defaultOptions } = await prepareEpubGeneration(bookSlug);

  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  try {
    // Submit the build request
    const requestId = await submitEpubBuildRequest({
      bookId,
      bookSlug: slug,
      chapters,
      metadata,
      options: mergedOptions,
    });

    return { 
      success: true, 
      requestId,
      message: 'EPUB generation started successfully' 
    };
  } catch (error) {
    console.error('Error generating EPUB:', error);
    throw new Error('Failed to start EPUB generation');
  }
}
