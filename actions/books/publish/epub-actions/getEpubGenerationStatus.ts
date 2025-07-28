'use server';

import { headers } from 'next/headers';
import { getSession } from '@/actions/auth/get-session';
import { GenerationStatus } from './types';
import { getApiUrl } from './utils';

async function isGitHubTokenValid(): Promise<boolean> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  return authHeader === `Bearer ${process.env.NEXT_EPUB_SECRET}`;
}

export async function getEpubGenerationStatus(
  bookSlug: string,
  runId: string
): Promise<GenerationStatus> {
  const tokenValid = await isGitHubTokenValid();
  
  // If not a GitHub Action request, check user session
  if (!tokenValid) {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Not authenticated');
    }
  }

  const url = getApiUrl(`/api/books/${bookSlug}/publish/status?run_id=${runId}`);
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add GitHub token if available
    if (tokenValid) {
      headers['Authorization'] = `Bearer ${process.env.NEXT_EPUB_SECRET}`;
    }

    const response = await fetch(url, {
      headers,
      next: { revalidate: 10 } // Revalidate every 10 seconds
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch EPUB generation status');
    }

    return response.json() as Promise<GenerationStatus>;
  } catch (error) {
    console.error('Failed to fetch EPUB generation status:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch EPUB generation status'
    );
  }
}
