'use server';

import { getSession } from '@/actions/auth/get-session';
import { GenerationStatus } from './types';
import { getAuthHeaders, getApiUrl, handleApiResponse } from './utils';

export async function getEpubGenerationStatus(
  bookSlug: string,
  runId: string
): Promise<GenerationStatus> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const url = getApiUrl(`/api/books/${bookSlug}/publish/status?run_id=${runId}`);
  
  try {
    const response = await fetch(url, {
      headers: await getAuthHeaders(),
      next: { revalidate: 10 } // Revalidate every 10 seconds
    });

    return handleApiResponse<GenerationStatus>(response);
  } catch (error) {
    console.error('Failed to fetch EPUB generation status:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch EPUB generation status'
    );
  }
}
