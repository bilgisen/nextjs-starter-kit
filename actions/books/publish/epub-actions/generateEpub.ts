'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/actions/auth/get-session';
import { PublishOptions, GenerationResponse } from './types';
import { getAuthHeaders, getApiUrl, handleApiResponse } from './utils';

export async function generateEpub(
  bookSlug: string,
  options: Omit<PublishOptions, 'output_format'>
): Promise<GenerationResponse> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const url = getApiUrl(`/api/books/${bookSlug}/publish/epub`);
  const payload = {
    ...options,
    output_format: 'epub' as const,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const result = await handleApiResponse<GenerationResponse>(response);
    
    // Revalidate any relevant paths
    revalidatePath(`/dashboard/books/${bookSlug}/publish`);
    
    return result;
  } catch (error) {
    console.error('EPUB generation failed:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to generate EPUB. Please try again.'
    );
  }
}
