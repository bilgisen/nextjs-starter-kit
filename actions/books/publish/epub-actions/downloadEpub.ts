'use server';

/**
 * Handles the download of a generated EPUB file
 * Returns the download URL and filename for client-side handling
 */
export default async function downloadEpub(downloadUrl: string, filename: string) {
  try {
    // For client-side download, we'll return the URL and let the client handle it
    
    // If the URL is a data URL, we can return it directly
    if (downloadUrl.startsWith('data:')) {
      return { downloadUrl, filename };
    }
    
    // For server-side download, we would need to implement file handling
    throw new Error('Server-side download not implemented');
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download EPUB');
  }
}
