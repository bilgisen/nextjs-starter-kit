'use server';

import { getSession } from '@/actions/auth/get-session';
import { DownloadResult } from './types';
import { getApiUrl } from './utils';

export async function downloadEpub(
  bookSlug: string,
  artifactId: number
): Promise<DownloadResult> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }

  const url = getApiUrl(`/api/books/${bookSlug}/publish/download?artifact_id=${artifactId}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_EPUB_SECRET}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to download EPUB');
    }

    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('content-disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `book-${bookSlug}.epub`;

    // Create a blob from the response
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    return {
      success: true,
      downloadUrl: blobUrl,
      filename
    };
  } catch (error) {
    console.error('EPUB download failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download EPUB'
    };
  }
}
