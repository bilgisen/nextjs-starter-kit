'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { pollEpubBuildStatus } from '@/lib/publish/epub/submitEpubBuildRequest';
import type { EpubBuildStatus } from '@/types/epub';

/**
 * Gets the current status of an EPUB generation
 */
export default async function getEpubGenerationStatus(bookSlug: string, requestId: string): Promise<EpubBuildStatus> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    // Get the current build status
    const status = await pollEpubBuildStatus(requestId);
    
    if (!status) {
      throw new Error('Build status not found');
    }

    return status;
  } catch (error) {
    console.error('Error fetching build status:', error);
    throw new Error('Failed to get EPUB generation status');
  }
}
